from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid
import json
import asyncio
from services.youtube import fetch_youtube_transcript
from services.pdf import extract_text_from_pdf
from services.chunking import chunk_text
from services.gemini_client import get_embedding
from services.supabase_client import supabase_client
import services.groq_client as groq

router = APIRouter()

async def generate_master_summary_background(document_id: str):
    """
    Background Map-Reduce Task:
    1. Fetches all chunks for the document.
    2. Maps: Generates a short summary for each chunk concurrently.
    3. Reduces: Combines all chunk summaries into a single master summary.
    4. Saves the master summary to the database.
    """
    try:
        # 1. Fetch chunks
        chunks_res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", document_id) \
            .execute()
        
        if not chunks_res.data:
            return
            
        chunks = [item["content"] for item in chunks_res.data[:10]] # Limit to 10 for much faster processing
        
        # 2. Map: Analyze chunks sequentially to avoid Groq 30-RPM Free Tier limits
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            prompt = f"""
            You are an AI academic assistant. Analyze the following content chunk from a larger document.
            Generate a summary of MAXIMUM 100 words. This is a strict word limit.
            Extract key concepts, important definitions, and the main topic.
            Respond in JSON: {{"main_topic": "", "summary": "", "key_concepts": [], "important_definitions": [], "important_points": []}}
            
            Content:
            {chunk}
            """
            try:
                # Mandatory 2.5s delay to strictly avoid Groq's 30 RPM limit (1 req every 2 sec)
                if i > 0:
                    await asyncio.sleep(2.5) 
                res = await groq.generate_study_material(prompt)
                parsed = json.loads(res)
                chunk_summaries.append(f"Topic: {parsed.get('main_topic')}\nSummary: {parsed.get('summary')}\nKey Concepts: {', '.join(parsed.get('key_concepts', []))}")
            except Exception as e:
                print(f"Failed to analyze chunk: {e}")
                
        if not chunk_summaries:
            supabase_client.table("documents").update({"master_summary": "ERROR: Failed to map chunks."}).eq("id", document_id).execute()
            return
            
        # 3. Intermediate Reduce: Group into batches of 5
        batch_size = 5
        intermediate_summaries = []
        for i in range(0, len(chunk_summaries), batch_size):
            batch = chunk_summaries[i:i + batch_size]
            combined_batch = "\n\n---\n\n".join(batch)
            
            intermediate_prompt = f"""
            You are an expert AI tutor. Combine the following sequential summaries into a cohesive mini-master summary.
            Your output MUST be a maximum of 150 words. This is a strict limit.
            Extract the overarching theme and key concepts from this specific section of the document.
            Respond in JSON: {{"section_theme": "", "combined_summary": ""}}
            
            Summaries:
            {combined_batch}
            """
            try:
                await asyncio.sleep(2.5)
                i_res = await groq.generate_study_material(intermediate_prompt)
                i_parsed = json.loads(i_res)
                intermediate_summaries.append(f"Theme: {i_parsed.get('section_theme')}\nSummary: {i_parsed.get('combined_summary')}")
            except Exception as e:
                print(f"Failed intermediate summarize: {e}")
                
        if not intermediate_summaries:
            supabase_client.table("documents").update({"master_summary": "ERROR: Failed to reduce summaries."}).eq("id", document_id).execute()
            return

        # 4. Final Reduce: Master Summary
        final_combined = "\n\n---\n\n".join(intermediate_summaries)
        reduce_prompt = f"""
        You are an expert educational AI. Below are intermediate structured summaries from the entire document.
        Generate a final, comprehensive master summary strictly between 500-700 words maximum.
        Identify the absolute central theme of the entire work, merge overarching concepts, and organize logically.
        Respond in JSON: {{"central_theme": "", "master_summary": "", "major_topics": [], "concept_relationships": []}}
        
        Summaries:
        {final_combined}
        """
        
        await asyncio.sleep(2.5)
        master_res = await groq.generate_study_material(reduce_prompt, model=groq.GROQ_MODEL_SMART)
        
        # 4. Save to DB
        supabase_client.table("documents").update({"master_summary": master_res}).eq("id", document_id).execute()
        print(f"Successfully generated and saved Master Summary for document {document_id}")
        
    except Exception as e:
        import traceback
        print(f"Error in background summary task: {e}")
        print(traceback.format_exc())
        supabase_client.table("documents").update({"master_summary": f"ERROR: Unhandled exception: {str(e)}"}).eq("id", document_id).execute()

class YouTubeURL(BaseModel):
    url: str

@router.post("/youtube")
async def upload_youtube(body: YouTubeURL, background_tasks: BackgroundTasks):
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
        
        # Trigger background summary generation (DISABLED - REVERTED TO LEGACY)
        # background_tasks.add_task(generate_master_summary_background, document_id)

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
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
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
        
        # Trigger background summary generation (DISABLED - REVERTED TO LEGACY)
        # background_tasks.add_task(generate_master_summary_background, document_id)
        
        return {"status": "success", "document_id": document_id, "chunks_processed": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
