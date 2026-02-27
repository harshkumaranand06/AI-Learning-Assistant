from fastapi import APIRouter, HTTPException
from services.supabase_client import get_user_credits

router = APIRouter()

@router.get("/credits")
async def fetch_user_credits():
    try:
        # Currently using a default email as in the rest of the application
        credits = await get_user_credits("default@example.com")
        return {"credits": credits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
