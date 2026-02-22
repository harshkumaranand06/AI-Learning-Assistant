from groq import AsyncGroq
from core.config import settings

if not settings.GROQ_API_KEY:
    print("Warning: GROQ_API_KEY is missing from environment variables.")

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"
