from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from services.supabase_client import supabase_client, deduct_credit
import services.groq_client as groq

router = APIRouter()

class PathRequest(BaseModel):
    goal: str
    days: int

@router.post("/generate")
async def generate_learning_path(req: PathRequest):
    try:
        # 1. Deduct credits
        if not await deduct_credit():
            raise HTTPException(status_code=402, detail="Insufficient credits.")

        # 2. Prompt Groq for the study plan
        prompt = f"""
        You are an elite AI Study Coach. The user wants to learn the following topic: "{req.goal}"
        They have exactly {req.days} days to achieve this goal.
        
        Create a detailed, day-by-day learning roadmap. 
        Break the topic down into logical progressions.
        
        CRITICAL OUTPUT INSTRUCTIONS:
        1. You must output ONLY valid JSON. 
        2. You MUST generate EXACTLY {req.days} objects in the "days" array. Do not stop at 10 or 15 days.
        3. Even if the topic is simple, spread it across the full {req.days} days.
        
        JSON Structure:
        {{
            "days": [
                {{
                    "day": 1,
                    "topic": "Title of the day's focus",
                    "description": "Short 1-2 sentence explanation of what to study",
                    "completed": false
                }},
                ... (continue for all {req.days} days)
            ]
        }}
        """

        # Using the Smart model for short paths, and Fast model for long paths to prevent timeouts
        # The 8B model is much faster and more reliable for large JSON responses on the free tier.
        target_model = groq.GROQ_MODEL_SMART if req.days <= 14 else groq.GROQ_MODEL_FAST
        max_t = 3000 if req.days > 14 else 1500

        raw_response = await groq.generate_study_material(
            prompt, 
            model=target_model, 
            max_tokens=max_t
        )
        roadmap_data = json.loads(raw_response)

        # Ensure the 'completed' field exists and is false
        if "days" in roadmap_data:
            for day in roadmap_data["days"]:
                day["completed"] = False

        # 3. Save to Supabase
        db_res = supabase_client.table("learning_paths").insert({
            "goal": req.goal,
            "timeframe_days": req.days,
            "roadmap": roadmap_data
        }).execute()

        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to save learning path to database.")

        return {
            "status": "success",
            "path_id": db_res.data[0]["id"],
            "data": db_res.data[0]
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{path_id}")
async def get_learning_path(path_id: str):
    try:
        db_res = supabase_client.table("learning_paths").select("*").eq("id", path_id).single().execute()
        if not db_res.data:
            raise HTTPException(status_code=404, detail="Learning path not found.")
        return db_res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CompleteDayRequest(BaseModel):
    day: int
    completed: bool

@router.put("/{path_id}/complete")
async def update_day_status(path_id: str, req: CompleteDayRequest):
    try:
        # 1. Fetch current roadmap
        db_res = supabase_client.table("learning_paths").select("roadmap").eq("id", path_id).single().execute()
        if not db_res.data:
            raise HTTPException(status_code=404, detail="Learning path not found.")
        
        roadmap = db_res.data["roadmap"]
        
        # 2. Update the specific day
        updated = False
        if "days" in roadmap:
            for d in roadmap["days"]:
                if d.get("day") == req.day:
                    d["completed"] = req.completed
                    updated = True
                    break
                    
        if not updated:
            raise HTTPException(status_code=400, detail=f"Day {req.day} not found in roadmap.")
            
        # 3. Save back to DB
        update_res = supabase_client.table("learning_paths").update({
            "roadmap": roadmap
        }).eq("id", path_id).execute()
        
        return {"status": "success", "roadmap": roadmap}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
