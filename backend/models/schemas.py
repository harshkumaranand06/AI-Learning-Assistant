from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class YouTubeRequest(BaseModel):
    url: str

class Flashcard(BaseModel):
    question: str
    answer: str

class MCQQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    document_id: Optional[str] = None
