from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routes import upload, generate, chat, user

app = FastAPI(
    title="AI Learning Assistant API",
    description="Backend API for document upload, flashcards, quizzes, and RAG chat.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generate"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(user.router, prefix="/api/user", tags=["User"])

@app.get("/health")
def health_check():
    import inspect
    from services.gemini_client import get_embedding
    src = inspect.getsource(get_embedding)
    import sys
    return {"status": "healthy", "src": src, "modules": list(sys.modules.keys())[:10]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8080, reload=False)
