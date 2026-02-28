import asyncio
import os
import json
import sys

# Add the current directory to path so we can import services
sys.path.append(os.getcwd())

from services.groq_client import generate_study_material, GROQ_MODEL_SMART

async def test_30_days():
    prompt = """
    You are an elite AI Study Coach. The user wants to learn the following topic: "full stack"
    They have exactly 30 days to achieve this goal.
    
    Create a detailed, day-by-day learning roadmap. 
    Break the topic down into logical progressions.
    
    CRITICAL OUTPUT INSTRUCTIONS:
    1. You must output ONLY valid JSON. 
    2. You MUST generate EXACTLY 30 objects in the "days" array. Do not stop at 10 or 15 days.
    3. Even if the topic is simple, spread it across the full 30 days.
    
    JSON Structure:
    {
        "days": [
            {
                "day": 1,
                "topic": "Title of the day's focus",
                "description": "Short 1-2 sentence explanation of what to study",
                "completed": false
            }
        ]
    }
    """
    print(f"Testing Groq with model: {GROQ_MODEL_SMART} and max_tokens: 3000")
    try:
        response = await generate_study_material(prompt, model=GROQ_MODEL_SMART, max_tokens=3000)
        print("Response received successfully!")
        data = json.loads(response)
        print(f"Number of days generated: {len(data.get('days', []))}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_30_days())
