from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from .models import User, ChatSession
from .chat import get_current_user
from .schemas import UserCreate, UserLogin, UserRead
from .database import get_db
from dotenv import load_dotenv
from pathlib import Path
import os

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
# JWT setup
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.now() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Register router
router = APIRouter()

@router.post("/register", response_model=UserRead)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserRead.model_validate(new_user)

from fastapi import Response

from fastapi import Response

@router.post("/login")
def login(form: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    # Set token as HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=3600,  # 1 hour
        expires=3600,
        samesite="lax",
        secure=False  # Set True if using HTTPS
    )
    return {"message": "Login successful"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logout successful"}

@router.get("/user/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from pydantic import BaseModel

from pydantic import BaseModel

class CreateSessionRequest(BaseModel):
    title: str = None
    is_personal: bool = False

@router.post("/create_session")
async def create_chat_session(
    req: CreateSessionRequest,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Generate a new unique session ID
    session_id = str(uuid.uuid4())
    # Create new ChatSession row for this user
    new_session = ChatSession(session_id=session_id, user_id=current_user.id, title=req.title, is_personal=req.is_personal)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": session_id}

@router.delete("/delete_session/{session_id}")
def delete_chat_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"}
