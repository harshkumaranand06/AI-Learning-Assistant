import asyncio
from services.youtube import fetch_youtube_transcript
from services.chunking import chunk_text
from services.gemini_client import get_embedding

async def main():
    try:
        url = "https://www.youtube.com/watch?v=GJLlxj_dtq8"
        print(f"Fetching transcript for {url}...")
        text = fetch_youtube_transcript(url)
        print(f"Transcript fetched. Length: {len(text)}")
        
        chunks = chunk_text(text)
        print(f"Chunked into {len(chunks)} parts")
        
        print("Testing get_embedding on first chunk...")
        emb = await get_embedding(chunks[0])
        print(f"Embedding successful! Vector length: {len(emb)}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
