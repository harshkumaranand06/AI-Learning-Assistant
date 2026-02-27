import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from services.groq_client import generate_study_material

async def test():
    try:
        res = await generate_study_material("Test prompt: generate a flashcard about python")
        print("Success:", res)
    except Exception as e:
        with open("groq_error.txt", "w") as f:
            f.write(str(e))
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                f.write("\n\nResponse:\n" + e.response.text)
        print("Error written to groq_error.txt")

if __name__ == "__main__":
    asyncio.run(test())
