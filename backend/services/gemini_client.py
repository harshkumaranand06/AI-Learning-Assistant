from google import genai
from google.genai import types
from core.config import settings

# Use AsyncClient for non-blocking FastAPI integration
client = genai.Client(api_key=settings.GEMINI_API_KEY, http_options={'api_version': 'v1beta'})

GENERATIVE_MODEL = "models/gemini-2.0-flash"
EMBEDDING_MODEL = "models/gemini-embedding-001"

async def get_embedding(text: str) -> list[float]:
    """Generates an embedding for the given text."""
    # Note: genai.Client has both sync and async capabilities 
    # but for simple usage in FastAPI we just prefix with await if using AsyncClient
    # However, google-genai 0.1.0+ has genai.Client(..., http_options={'api_version': 'v1beta'}).aio
    
    result = await client.aio.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return result.embeddings[0].values

async def generate_study_material(prompt: str) -> str:
    """Generates study material (flashcards/quiz) using Gemini 2.0 Flash."""
    # Enable search tool to help if transcript is missing
    search_tool = types.Tool(google_search=types.GoogleSearchRetrieval())
    
    response = await client.aio.models.generate_content(
        model=GENERATIVE_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
            tools=[search_tool]
        )
    )
    return response.text
