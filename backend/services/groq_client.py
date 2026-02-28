from groq import AsyncGroq
from core.config import settings

if not settings.GROQ_API_KEY:
    print("Warning: GROQ_API_KEY is missing from environment variables.")

# Increase timeout to 60s for long-running 70B generation
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=60.0)

GROQ_MODEL_FAST = "llama-3.1-8b-instant"
GROQ_MODEL_SMART = "llama-3.3-70b-versatile"

async def generate_study_material(prompt: str, response_format: dict | None = {"type": "json_object"}, model: str = GROQ_MODEL_FAST, max_tokens: int = 700) -> str:
    """Generates study material (flashcards/quiz) using Groq (Llama)."""
    kwargs = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": max_tokens
    }
    if response_format:
        kwargs["response_format"] = response_format
        
    try:
        response = await groq_client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {type(e).__name__}: {str(e)}")
        # Raise so the route can catch and report back to user
        raise e
