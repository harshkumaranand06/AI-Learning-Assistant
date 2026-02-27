import asyncio
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from services.supabase_client import supabase_client

async def main():
    try:
        res = supabase_client.table("profiles").select("*").eq("email", "default@example.com").execute()
        print("Current profile:", res.data)
        if res.data:
            supabase_client.table("profiles").update({"credits": 100}).eq("email", "default@example.com").execute()
            print("Added 100 credits to default@example.com")
        else:
            supabase_client.table("profiles").insert({"email": "default@example.com", "credits": 100}).execute()
            print("Created default@example.com with 100 credits")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
