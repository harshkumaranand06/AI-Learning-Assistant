from fastapi import APIRouter, HTTPException
from services.supabase_client import supabase_client

router = APIRouter()

@router.get("/")
def get_library_documents():
    try:
        res = supabase_client.table("documents").select(
            "id, title, source_type, folder_name, tags, created_at"
        ).order("created_at", desc=True).execute()
        
        return {"documents": res.data}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
