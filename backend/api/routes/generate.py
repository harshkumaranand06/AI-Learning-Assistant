from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import typing_extensions as typing
import json
from services.supabase_client import supabase_client
from services.groq_client import groq_client, GROQ_MODEL
from models.schemas import Flashcard, MCQQuestion

router = APIRouter()

class DocumentRequest(BaseModel):
    document_id: str

class FlashcardType(typing.TypedDict):
    question: str
    answer: str

class FlashcardsResponse(typing.TypedDict):
    flashcards: list[FlashcardType]

class MCQType(typing.TypedDict):
    question: str
    options: list[str]
    correct_answer: str

class MCQResponse(typing.TypedDict):
    questions: list[MCQType]

@router.post("/flashcards", response_model=List[Flashcard])
async def generate_flashcards(req: DocumentRequest):
    try:
        # --- Real Groq implementation ---
        res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", req.document_id) \
            .execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document chunks not found.")
        combined_text = "\n\n".join([item["content"] for item in res.data[:20]])
        prompt = f"""
        Based on the following document context, generate 10-15 highly effective flashcards to study the material.
        Each flashcard must have a 'question' and an 'answer'.
        IMPORTANT: Always write all questions and answers in English.
        Provide the output in JSON format with a single key "flashcards" containing an array of objects.
        Context: {combined_text[:15000]}
        """
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("flashcards", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz", response_model=List[MCQQuestion])
async def generate_quiz(req: DocumentRequest):
    try:
        # --- Real Groq implementation ---
        res = supabase_client.table("document_chunks") \
            .select("content") \
            .eq("document_id", req.document_id) \
            .execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document chunks not found.")
        combined_text = "\n\n".join([item["content"] for item in res.data[:20]])
        prompt = f"""
        Based on the following document context, generate a 7-10 question multiple-choice quiz.
        Each question must have a 'question', 4 'options', and the 'correct_answer' (which must be exactly one of the options).
        IMPORTANT: Always write all questions and answers in English.
        Provide the output in JSON format with a single key "questions" containing an array of objects.
        Context: {combined_text[:15000]}
        """
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("questions", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

