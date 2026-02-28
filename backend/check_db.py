import asyncio
import os
import sys

# Add backend directory to python path
sys.path.append(r"c:\Users\harsh\OneDrive\Desktop\apps\assignment 3\backend")

from services.supabase_client import supabase_client

async def check():
    try:
        res = supabase_client.table("documents").select("id, title, master_summary, created_at").order("created_at", desc=True).limit(1).execute()
        if res.data:
            doc = res.data[0]
            print(f"\nVerifying Document: {doc['title']}")
            summary = doc.get('master_summary')
            if summary:
                print(f"STATUS: SUCCESS")
                print(f"Summary length: {len(summary)}")
                print(f"Preview: {summary[:100]}...")
            else:
                print("STATUS: STILL EMPTY (Wait for processing or check for errors)")
        else:
            print("No documents found.")
    except Exception as e:
        print(f"Verification Error: {e}")
    except Exception as e:
        print(f"Supabase Error Type: {type(e)}")
        print(f"Supabase Error Content: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check())
