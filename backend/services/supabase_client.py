from supabase import create_client, Client
from core.config import settings

def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase credentials not found in environment variables")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase_client = get_supabase_client()
async def get_user_credits(email: str = "default@example.com") -> int:
    """Gets the current credit balance for the user."""
    res = supabase_client.table("profiles").select("credits").eq("email", email).single().execute()
    return res.data["credits"] if res.data else 0

async def deduct_credit(email: str = "default@example.com") -> bool:
    """Deducts 1 credit from the user's balance."""
    credits = await get_user_credits(email)
    if credits <= 0:
        return False
    
    supabase_client.table("profiles").update({"credits": credits - 1}).eq("email", email).execute()
    return True

async def get_cached_content(document_id: str):
    """Retrieves cached flashcards and quiz for a document."""
    res = supabase_client.table("generated_content").select("*").eq("document_id", document_id).execute()
    return res.data[0] if res.data else None

async def cache_content(document_id: str, flashcards: list, quiz: list, summary: str = None):
    """Stores generated flashcards, quiz, and summary in the cache."""
    # Delete existing record first to avoid unique constraint violations
    supabase_client.table("generated_content").delete().eq("document_id", document_id).execute()
    supabase_client.table("generated_content").insert({
        "document_id": document_id,
        "flashcards": flashcards,
        "quiz": quiz,
        "summary": summary
    }).execute()
