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
    difficulty: Optional[str] = "medium"

@router.post("/all")
async def generate_all(req: DocumentRequest):
    try:
        # 1. Check cache (only for medium difficulty to avoid schema changes)
        if req.difficulty == "medium":
            cache = await get_cached_content(req.document_id)
            if cache:
                return {
                    "flashcards": cache["flashcards"],
                    "questions": cache["quiz"]
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
            - Generate the flashcards and quiz as if you are a teacher who watched the video and is quizzing students on its content
            """

        difficulty_prompt = {
            "easy": "Write EASY questions. Focus on basic definitions, direct recall of facts, and fundamental concepts. Use simple language.",
            "medium": "Write MEDIUM questions. Focus on standard application, understanding of core concepts, and general knowledge. This is the standard difficulty.",
            "hard": "Write HARD questions. Focus on complex synthesis, multi-step analysis, edge cases, and critical thinking. The distractors (wrong options) should be highly plausible."
        }.get(req.difficulty.lower(), "Write questions of STANDARD difficulty.")

        prompt = f"""
        Generate BOTH 10-12 key flashcards AND a 5-8 question multiple-choice quiz on the educational topic from the source below.
        
        Difficulty Instruction:
        {difficulty_prompt}
        
        Rules:
        - FLASHCARDS: each must have 'question' and 'answer' about factual content, definitions, or concepts
        - QUIZ: each must have 'question', 4 'options', and 'correct_answer' (must exactly match one of the options)
        - Focus only on teaching the CORE SUBJECT MATTER — not describing the video itself
        - Write everything in English
        - Output valid JSON with exactly two keys: "flashcards" and "questions"
        
        {context_part}
        """

        # 4. Call AI service — Groq for both YouTube and PDF (Gemini quota exhausted)
        raw_response = await groq.generate_study_material(prompt)
        
        data = json.loads(raw_response)
        flashcards = data.get("flashcards", [])
        quiz = data.get("questions", [])

        # 5. Cache result (only if medium)
        if req.difficulty == "medium":
            await cache_content(req.document_id, flashcards, quiz)

        return {
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

@router.post("/mindmap")
async def generate_mindmap(req: DocumentRequest):
    try:
        if not await deduct_credit():
            raise HTTPException(status_code=402, detail="Insufficient credits.")

        doc_res = supabase_client.table("documents").select("*").eq("id", req.document_id).single().execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found.")
        
        chunks_res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", req.document_id) \
            .execute()
        
        combined_text = "\n\n".join([item["content"] for item in chunks_res.data[:20]]) if chunks_res.data else ""
        
        prompt = f"""
        Generate a mind map based on the following content. 
        Extract the central topic as the root node, and create a logical hierarchy of related sub-topics and details.
        
        Rules:
        - Output MUST be valid JSON with EXACTLY two keys: "nodes" and "edges"
        - "nodes" must be an array of objects: {{"id": "unique_string", "data": {{"label": "Topic Name"}}}}
        - "edges" must be an array of objects: {{"id": "e_source_target", "source": "source_node_id", "target": "target_node_id"}}
        - Ensure every target in an edge explicitly matches a valid node id.
        - Create a rich, detailed hierarchy (aim for 10-20 nodes).
        
        Content:
        {combined_text[:15000]}
        """

        raw_response = await groq.generate_study_material(prompt)
        data = json.loads(raw_response)
        
        return {
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", [])
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

class TopicRequest(BaseModel):
    document_id: str
    topic: str

@router.post("/explain-topic")
async def explain_topic(req: TopicRequest):
    try:
        if not await deduct_credit():
            raise HTTPException(status_code=402, detail="Insufficient credits.")

        doc_res = supabase_client.table("documents").select("*").eq("id", req.document_id).single().execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found.")
        
        chunks_res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", req.document_id) \
            .execute()
        
        combined_text = "\n\n".join([item["content"] for item in chunks_res.data[:20]]) if chunks_res.data else ""
        
        prompt = f"""
        Based on the following content, explain the subtopic "{req.topic}" in detail.
        Provide a concise but thorough explanation (2-3 paragraphs) that connects this topic to the broader context of the document.
        Keep the formatting clean and readable using markdown.
        IMPORTANT: You MUST respond entirely in English.
        
        Content:
        {combined_text[:15000]}
        """

        raw_response = await groq.generate_study_material(prompt, response_format=None)
        
        return {
            "explanation": raw_response
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
