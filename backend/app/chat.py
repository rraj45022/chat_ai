import os
from fastapi import APIRouter, Depends, HTTPException, status
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

# Initialize FastAPI app
router = APIRouter()
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
bearer_scheme = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
):
    token = creds.credentials
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM") or "HS256"
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
    return [{"role": m.role, "content": m.content} for m in messages]


def save_message(db: Session, session_id: str, user_id: int, role: str, content: str):
    # Verify session ownership before saving
    session = db.query(ChatSession).filter_by(session_id=session_id, user_id=user_id).first()
    if not session:
        raise ValueError("Session not found or access denied")
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    db.commit()


# Use environment variable for safety: export XAI_API_KEY=your-grok-key
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


# ----- Pydantic models -----
class Message(BaseModel):
    role: str    # "user" or "assistant"
    content: str

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
            created_at=s.created_at.isoformat()
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
    # Build list of dicts
    messages = [{"role": m.role, "content": m.content} for m in conversation]
    return {"conversation": messages}


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
    conversation = get_chat_history(db, req.session_id, current_user.id)    # Add user message to DB
    save_message(db, req.session_id, current_user.id, "user", req.message)
    # Re-fetch with user's message
    conversation = get_chat_history(db, req.session_id, current_user.id)
    context_window = conversation[-10:]

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # Use your Grok model name here (see xAI docs for latest)
            messages=context_window,
            temperature=0.2
        )
        assistant_reply = response.choices[0].message.content
        # Add assistant reply to conversation
        save_message(db, req.session_id, current_user.id, "assistant", assistant_reply)
        # Update conversation with assistant reply
        conversation = get_chat_history(db, req.session_id, current_user.id)
        return ChatResponse(reply=assistant_reply, conversation=conversation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
