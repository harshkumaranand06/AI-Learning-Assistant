from google import genai
from google.genai import types
from core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

GENERATIVE_MODEL = "models/gemini-2.0-flash"
EMBEDDING_MODEL = "models/gemini-embedding-001"

async def get_embedding(text: str) -> list[float]:
    """Generates an embedding for the given text."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values
