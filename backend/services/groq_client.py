from groq import AsyncGroq
from core.config import settings

if not settings.GROQ_API_KEY:
    print("Warning: GROQ_API_KEY is missing from environment variables.")

groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

GROQ_MODEL = "llama-3.3-70b-versatile"
async def generate_study_material(prompt: str, response_format: dict | None = {"type": "json_object"}) -> str:
    """Generates study material (flashcards/quiz) using Groq (Llama)."""
    kwargs = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    if response_format:
        kwargs["response_format"] = response_format
        
    response = await groq_client.chat.completions.create(**kwargs)
    return response.choices[0].message.content
