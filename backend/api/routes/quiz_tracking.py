from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from services.supabase_client import supabase_client

router = APIRouter()

class QuizSubmitRequest(BaseModel):
    document_id: str
    difficulty: str
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int
    wrong_answers: Optional[Dict[str, Any]] = None

@router.post("/submit")
def submit_quiz_attempt(req: QuizSubmitRequest):
    try:
        data = {
            "document_id": req.document_id,
            "difficulty": req.difficulty,
            "score": req.score,
            "total_questions": req.total_questions,
            "percentage": req.percentage,
            "time_taken_seconds": req.time_taken_seconds,
            "wrong_answers": req.wrong_answers
        }
        res = supabase_client.table("quiz_attempts").insert(data).execute()
        return {"success": True, "attempt": res.data[0] if res.data else None}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
def get_analytics():
    try:
        res = supabase_client.table("quiz_attempts").select("*, documents(title)").order("created_at", desc=True).execute()
        
        attempts = res.data or []
        
        total_quizzes = len(attempts)
        avg_score = sum(a["percentage"] for a in attempts) / total_quizzes if total_quizzes > 0 else 0
        total_time = sum(a.get("time_taken_seconds") or 0 for a in attempts)
        
        return {
            "stats": {
                "total_quizzes": total_quizzes,
                "average_score": round(avg_score, 1),
                "total_study_time": total_time
            },
            "recent_attempts": attempts[:10]
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
