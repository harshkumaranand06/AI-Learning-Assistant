from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import typing_extensions as typing
import json
from services.supabase_client import (
    supabase_client, 
    get_user_credits, 
    deduct_credit, 
    get_cached_content, 
    cache_content
)
import services.gemini_client as gemini
import services.groq_client as groq
from models.schemas import Flashcard, MCQQuestion

router = APIRouter()

class DocumentRequest(BaseModel):
    document_id: str

@router.post("/all")
async def generate_all(req: DocumentRequest):
    try:
        # 1. Check cache
        cache = await get_cached_content(req.document_id)
        if cache:
            return {
                "flashcards": cache["flashcards"],
                "questions": cache.get("quiz", []),
                "summary": cache.get("summary", "Summary not available for this legacy document.")
            }

        # 2. Check and deduct credits
        if not await deduct_credit():
            raise HTTPException(status_code=402, detail="Insufficient credits.")

        # 3. Get document context and source type
        doc_res = supabase_client.table("documents").select("*").eq("id", req.document_id).single().execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found.")
        
        source_type = doc_res.data["source_type"]
        source_url = doc_res.data.get("source_url", "")
        
        chunks_res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", req.document_id) \
            .execute()
        
        combined_text = "\n\n".join([item["content"] for item in chunks_res.data[:20]]) if chunks_res.data else ""
        
        # Fallback: If no transcript, build a smart topic-discovery prompt
        if combined_text:
            context_part = f"Context (video transcript):\n{combined_text[:15000]}"
        else:
            context_part = f"""
            YouTube Video URL: {source_url}

            The transcript is unavailable. Based on your knowledge:
            - Look up or infer the title and subject matter of this specific YouTube video
            - Identify the CORE EDUCATIONAL TOPIC it teaches (e.g., Python loops, World War 2, photosynthesis, etc.)
            - Focus entirely on the SUBJECT MATTER, NOT on descriptions like "the video explains..." or "the motive of this video"
            - Generate a summary, the flashcards, and the quiz as if you are a teacher who watched the video and is quizzing students on its content
            """

        prompt = f"""
        Generate a 2-3 paragraph concise summary, 10-12 key flashcards, AND a 5-8 question multiple-choice quiz on the educational topic from the source below.
        
        Rules:
        - SUMMARY: A well-written overview of the core concepts taught.
        - FLASHCARDS: each must have 'question' and 'answer' about factual content, definitions, or concepts
        - QUIZ: each must have 'question', 4 'options', and 'correct_answer' (must exactly match one of the options)
        - Focus only on teaching the CORE SUBJECT MATTER — not describing the video itself
        - Write everything in English
        - Output valid JSON with exactly three keys: "summary", "flashcards", and "questions"
        
        {context_part}
        """

        # 4. Call AI service — Groq for both YouTube and PDF (Gemini quota exhausted)
        raw_response = await groq.generate_study_material(prompt)
        
        data = json.loads(raw_response)
        summary = data.get("summary", "Summary could not be generated.")
        flashcards = data.get("flashcards", [])
        quiz = data.get("questions", [])

        # 5. Cache result
        await cache_content(req.document_id, flashcards, quiz, summary)

        return {
            "summary": summary,
            "flashcards": flashcards,
            "questions": quiz
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flashcards", response_model=List[Flashcard])
async def generate_flashcards(req: DocumentRequest):
    # Use the unified logic but return only flashcards for compatibility
    res = await generate_all(req)
    return res["flashcards"]

@router.post("/quiz", response_model=List[MCQQuestion])
async def generate_quiz(req: DocumentRequest):
    # Use the unified logic but return only quiz for compatibility
    res = await generate_all(req)
    return res["questions"]
