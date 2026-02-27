from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.supabase_client import supabase_client
from services.gemini_client import get_embedding
from services.groq_client import groq_client, GROQ_MODEL
import json

router = APIRouter()

@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """Provide a streaming chat response using RAG."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")
        
    user_query = req.messages[-1].content
    
    try:
        # 1. Embed user query
        query_embedding = await get_embedding(user_query)
        
        # 2. Similarity search via RPC function
        rpc_res = supabase_client.rpc(
            "match_document_chunks", 
            {"query_embedding": query_embedding, "match_count": 5}
        ).execute()
        
        similar_chunks = rpc_res.data or []
        context_text = "\n\n".join([chunk["content"] for chunk in similar_chunks]) if similar_chunks else "No relevant context found."
        
        # 3. Build message history for Groq
        history = []
        for msg in req.messages[:-1]:
            role = 'assistant' if msg.role == 'assistant' else 'user'
            history.append({"role": role, "content": msg.content})

        # Build the final user message with context injected
        final_user_message = f"""
        INSTRUCTION: You are a helpful AI learning assistant. You MUST ALWAYS respond in strict English. 
        Do NOT respond in any other language, even if the provided context or user question contains another language like Hindi.
        
        Use the context below to answer the question:

        Context:
        {context_text}

        Question: {user_query}
        """

        history.append({"role": "user", "content": final_user_message})

        # 4. Stream response
        async def event_generator():
            try:
                stream = await groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=history,
                    stream=True,
                )
                async for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield f"data: {json.dumps({'content': content})}\n\n"
                        
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{traceback.format_exc()}")
