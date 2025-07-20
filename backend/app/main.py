from fastapi import FastAPI
from .database import engine
from .models import Base
from .auth import router as auth_router
from .chat import router as chat_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend origin(s)!
    allow_credentials=True,
    allow_methods=["*"],      # Allow all HTTP methods
    allow_headers=["*"],      # Allow all headers
)
# Register auth and chat routers
app.include_router(auth_router)
app.include_router(chat_router)
