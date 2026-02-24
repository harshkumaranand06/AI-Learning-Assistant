from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import uuid
from services.youtube import fetch_youtube_transcript
from services.pdf import extract_text_from_pdf
from services.chunking import chunk_text
from services.gemini_client import get_embedding
from services.supabase_client import supabase_client

router = APIRouter()

class YouTubeURL(BaseModel):
    url: str

@router.post("/youtube")
async def upload_youtube(body: YouTubeURL):
    try:
        # 1. Create document record FIRST (to ensure we have an ID for fallback)
        doc_res = supabase_client.table("documents").insert({
            "source_type": "youtube",
            "source_url": body.url,
            "title": f"YouTube Video: {body.url}"
        }).execute()
        
        if not doc_res.data:
            raise HTTPException(status_code=500, detail="Failed to create document record.")
            
        document_id = doc_res.data[0]["id"]
        
        # 2. Attempt transcript fetching and processing in a safe block
        transcript_text = ""
        try:
            print(f"Attempting to fetch transcript for {body.url}...")
            transcript_text = fetch_youtube_transcript(body.url)
            
            if transcript_text:
                chunks = chunk_text(transcript_text, chunk_size=700, chunk_overlap=100)
                if chunks:
                    chunk_records = []
                    for i, chunk in enumerate(chunks):
                        record = {
                            "document_id": document_id,
                            "content": chunk,
                            "metadata": {"chunk_index": i},
                        }
                        try:
                            embedding = await get_embedding(chunk)
                            record["embedding"] = embedding
                        except Exception as e:
                            print(f"Embedding skipped for chunk {i}: {e}")
                        chunk_records.append(record)
                    
                    if chunk_records:
                        supabase_client.table("document_chunks").insert(chunk_records).execute()
                        print(f"Stored {len(chunk_records)} chunks.")
        except Exception as e:
            # We log the error but don't fail the request
            print(f"YouTube processing partially failed: {str(e)}. Proceeding with URL fallback.")
        
        return {
            "status": "success", 
            "document_id": document_id, 
            "transcript_found": bool(transcript_text)
        }
    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"ERROR: {str(e)}\nTRACE: {tb_str}")
@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    try:
        pdf_bytes = await file.read()
        text_content = extract_text_from_pdf(pdf_bytes)
        
        chunks = chunk_text(text_content, chunk_size=700, chunk_overlap=100)
        if not chunks:
            raise HTTPException(status_code=400, detail="PDF text empty or could not be chunked.")
            
        doc_res = supabase_client.table("documents").insert({
            "source_type": "pdf",
            "source_url": file.filename,
            "title": file.filename
        }).execute()
        
        document_id = doc_res.data[0]["id"]
        
        chunk_records = []
        for i, chunk in enumerate(chunks):
            embedding = await get_embedding(chunk)
            chunk_records.append({
                "document_id": document_id,
                "content": chunk,
                "metadata": {"chunk_index": i},
                "embedding": embedding
            })
            
        supabase_client.table("document_chunks").insert(chunk_records).execute()
        
        return {"status": "success", "document_id": document_id, "chunks_processed": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
