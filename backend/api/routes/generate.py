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
    is_adaptive: Optional[bool] = False

@router.post("/all")
async def generate_all(req: DocumentRequest):
    try:
        # 1. Check cache (only for medium difficulty and non-adaptive to avoid schema changes)
        if req.difficulty == "medium" and not req.is_adaptive:
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
        master_summary = doc_res.data.get("master_summary", "")
        
        # Check for explicitly logged background task failures
        if master_summary and master_summary.startswith("ERROR:"):
            raise HTTPException(status_code=400, detail=f"Background Processing Failed: {master_summary}")

        # Fast Path: If we have a Map-Reduced Master Summary, format it directly
        if master_summary:
            context_part = f"""
            Pre-computed Document Master Summary & Knowledge Base:
            {master_summary}
            
            Based ENTIRELY on the structured knowledge above, generate the requested quiz and flashcards.
            """
        else:
            # LEGACY FALLBACK: Pull chunks directly if summary is missing
            chunks_res = supabase_client.table("document_chunks") \
                .select("content") \
                .eq("document_id", req.document_id) \
                .limit(5) \
                .execute()
            
            if chunks_res.data:
                combined_text = "\n\n".join([c["content"] for c in chunks_res.data])
                context_part = f"""
                Document Content Excerpts:
                {combined_text}
                
                Based on the excerpts above, generate the requested study material.
                """
            elif source_type == "youtube" and not source_url:
                context_part = f"""
                YouTube Video Transcript unavailable. Based on your knowledge:
                - Look up or infer the title and subject matter of this specific YouTube video
                - Identify the CORE EDUCATIONAL TOPIC it teaches
                - Focus entirely on the SUBJECT MATTER
                - Generate the flashcards and quiz
                """
            else:
                raise HTTPException(status_code=400, detail="No content found for this document.")
            


        difficulty_prompt = {
            "easy": "Write EASY questions. Focus on basic definitions, direct recall of facts, and fundamental concepts. Use simple language.",
            "medium": "Write MEDIUM questions. Focus on standard application, understanding of core concepts, and general knowledge. This is the standard difficulty.",
            "hard": "Write HARD questions. Focus on complex synthesis, multi-step analysis, edge cases, and critical thinking. The distractors (wrong options) should be highly plausible."
        }.get(req.difficulty.lower(), "Write questions of STANDARD difficulty.")

        adaptive_prompt = ""
        if req.is_adaptive:
            # Fetch the user's wrong answers from recent attempts for this document
            attempts_res = supabase_client.table("quiz_attempts") \
                .select("wrong_answers") \
                .eq("document_id", req.document_id) \
                .not_.is_('wrong_answers', 'null') \
                .order("created_at", desc=True) \
                .limit(3) \
                .execute()
            
            wrong_qs = []
            if attempts_res.data:
                for attempt in attempts_res.data:
                    for key, val_str in attempt["wrong_answers"].items():
                        try:
                            val = json.loads(val_str) if isinstance(val_str, str) else val_str
                            wrong_qs.append(val.get("question", ""))
                        except:
                            pass
            
            if wrong_qs:
                adaptive_prompt = f"""
                ADAPTIVE LEARNING OVERRIDE:
                The student previously got questions related to these topics WRONG:
                {json.dumps(wrong_qs[:10], indent=2)}

                CRITICAL INSTRUCTION: You MUST heavily bias the generated Flashcards and Quiz questions towards these specific weak areas. 
                Ensure they review the core concepts needed to answer those specific questions correctly next time.
                """

        prompt = f"""
        Generate BOTH 10-12 key flashcards AND a 5-8 question multiple-choice quiz on the educational topic from the source below.
        
        Difficulty Instruction:
        {difficulty_prompt}

        {adaptive_prompt}
        
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
    except HTTPException:
        raise
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
        
        # HARD CAP limit to prevent massive payload tokens
        combined_text = "\n\n".join([item["content"] for item in chunks_res.data[:5]]) if chunks_res.data else ""
        
        prompt = f"""
        Extract the core concepts from the following text and return them strictly in JSON format to build a React Flow graph.
        
        Rules:
        - Output MUST be valid JSON with EXACTLY two keys: "nodes" and "edges"
        - "nodes" must be an array of objects: {{"id": "unique_string", "data": {{"label": "Topic Name"}}}}
        - "edges" must be an array of objects: {{"id": "e_source_target", "source": "source_node_id", "target": "target_node_id"}}
        - Ensure every target in an edge explicitly matches a valid node id.
        - Create a rich, detailed hierarchy (aim for 10-20 nodes).
        
        Content:
        {combined_text[:6000]}
        """

        raw_response = await groq.generate_study_material(prompt)
        data = json.loads(raw_response)
        
        return {
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", [])
        }
    except HTTPException:
        raise
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
        
        # HARD CAP limit to prevent massive payload tokens
        combined_text = "\n\n".join([item["content"] for item in chunks_res.data[:5]]) if chunks_res.data else ""
        
        prompt = f"""
        Based on the following content, explain the subtopic "{req.topic}" in detail.
        Provide a concise but thorough explanation (2-3 paragraphs) that connects this topic to the broader context of the document.
        Keep the formatting clean and readable using markdown.
        IMPORTANT: You MUST respond entirely in English.
        
        Content:
        {combined_text[:6000]}
        """

        raw_response = await groq.generate_study_material(prompt, response_format=None)
        
        return {
            "explanation": raw_response
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

class NotesRequest(BaseModel):
    raw_notes: str

@router.post("/improve-notes")
async def improve_notes(req: NotesRequest):
    try:
        # Notes improvement doesn't strictly need a document_id as it works on raw text
        if not await deduct_credit():
            raise HTTPException(status_code=402, detail="Insufficient credits.")
        
        prompt = f"""
        You are an expert AI Tutor and study assistant. Review the following raw study notes provided by the user.

        Your task is to:
        1. Fix any grammar and spelling mistakes.
        2. Improve the formatting and structure (use headings, bullet points, bold text).
        3. Inject missing core concepts or context that the user likely forgot, to make these notes "exam-ready".
        4. Keep the output clean, highly readable, and structured in Markdown.
        5. Respond ONLY with the newly improved notes content. Do not include introductory text like "Here are your improved notes:".
        
        Raw Notes:
        {req.raw_notes}
        """

        raw_response = await groq.generate_study_material(prompt, response_format=None)
        
        return {
            "improved_notes": raw_response
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
