import os
from fastapi import APIRouter, Depends, HTTPException, status,  File, UploadFile
import whisper
import traceback
from pydantic import BaseModel
from typing import List, Dict
from openai import OpenAI  # OpenAI-compatible client
from dotenv import load_dotenv
from pathlib import Path
from fastapi.security import OAuth2PasswordBearer
from .database import get_db
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from .models import User, ChatMessage, ChatSession
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .encryption import encrypt_message, decrypt_message

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Initialize FastAPI app
router = APIRouter()
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
bearer_scheme = HTTPBearer()

from fastapi import Cookie

def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM") or "HS256"
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    if access_token is None:
        raise credentials_exception
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_chat_history(db: Session, session_id: str, user_id: int) -> list[dict]:
    # Ensure session ownership
    session = db.query(ChatSession).filter_by(session_id=session_id, user_id=user_id).first()
    if not session:
        return []

    messages = (
        db.query(ChatMessage)
        .filter_by(session_id=session_id)
        .order_by(ChatMessage.timestamp)
        .all()
    )
    decrypted_messages = []
    for m in messages:
        try:
            decrypted_content = decrypt_message(m.content)
        except Exception:
            decrypted_content = m.content  # fallback to original if decryption fails
        decrypted_messages.append({"role": m.role, "content": decrypted_content, "timestamp": m.timestamp.isoformat()})
    return decrypted_messages


import datetime

def save_message(db: Session, session_id: str, user_id: int, role: str, content: str):
    # Verify session ownership before saving
    session = db.query(ChatSession).filter_by(session_id=session_id, user_id=user_id).first()
    if not session:
        raise ValueError("Session not found or access denied")
    encrypted_content = encrypt_message(content)
    msg = ChatMessage(session_id=session_id, role=role, content=encrypted_content)
    db.add(msg)
    db.commit()





model = whisper.load_model("base")

@router.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    with open("temp.wav", "wb") as f:
        f.write(audio_bytes)
    # Transcribe audio file
    result = model.transcribe("temp.wav")
    #call /chat endpoint with the result input
    
    return {"transcript": result["text"]}


# Use environment variable for safety: export XAI_API_KEY=your-grok-key
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


# ----- Pydantic models -----
class Message(BaseModel):
    role: str    # "user" or "assistant"
    content: str
    timestamp: str

class ChatHistoryRequest(BaseModel):
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    conversation: List[Message]
    
class ChatHistoryResponse(BaseModel):
    conversation: List[Message]

class SessionSummary(BaseModel):
    session_id: str
    title: str = None       # Optional: add title support if your model includes it
    created_at: str
    is_personal: bool

@router.get("/user/sessions", response_model=List[SessionSummary])
def list_user_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    result = [
        SessionSummary(
            session_id=s.session_id,
            title=getattr(s, "title", None) or f"Chat {i+1}",
            created_at=s.created_at.isoformat(),
            is_personal=s.is_personal
        )
        for i, s in enumerate(sessions)
    ]
    return result

@router.post("/chat_history", response_model=ChatHistoryResponse)
def chat_history(
    req: ChatHistoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure session belongs to the user
    chat_session = db.query(ChatSession).filter_by(
        session_id=req.session_id, user_id=current_user.id
    ).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Fetch messages in order
    conversation = (
        db.query(ChatMessage)
        .filter_by(session_id=req.session_id)
        .order_by(ChatMessage.timestamp)
        .all()
    )
    decrypted_messages = []
    for m in conversation:
        try:
            decrypted_content = decrypt_message(m.content)
        except Exception:
            decrypted_content = m.content  # fallback to original if decryption fails
        decrypted_messages.append({"role": m.role, "content": decrypted_content, "timestamp": m.timestamp.isoformat()})
    return {"conversation": decrypted_messages}


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, 
                        current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    chat_session = db.query(ChatSession).filter_by(
        session_id=req.session_id,
        user_id=current_user.id
    ).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get chat history from DB
    conversation = get_chat_history(db, req.session_id, current_user.id)

    try:
        try:
            save_message(db, req.session_id, current_user.id, "user", req.message)
        except ValueError as ve:
            raise HTTPException(status_code=403, detail=str(ve))

        # Re-fetch with user's message
        conversation = get_chat_history(db, req.session_id, current_user.id)

        # If session is personal, just save and return conversation without AI response
        if chat_session.is_personal:
            return ChatResponse(reply="", conversation=conversation)

        context_window = conversation[-10:]
        filtered_context = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in context_window
        ]
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # Use your Grok model name here (see xAI docs for latest)
            messages=filtered_context,
            temperature=0.2
        )
        assistant_reply = response.choices[0].message.content
        # Add assistant reply to conversation
        save_message(db, req.session_id, current_user.id, "assistant", assistant_reply)
        # Update conversation with assistant reply
        conversation = get_chat_history(db, req.session_id, current_user.id)
        return ChatResponse(reply=assistant_reply, conversation=conversation)
    except Exception as e:
        tb_str = traceback.format_exc()
        print("Full traceback:\n", tb_str)  # This will show the error in your terminal
        # Optionally return the traceback in the response (NOT recommended for production)
        raise HTTPException(status_code=500, detail=f"Internal server error:\n{tb_str}")
