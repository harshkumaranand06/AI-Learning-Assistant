# AI Learning Assistant 🧠

A complete, production-ready AI Learning Assistant system that transforms YouTube videos and PDFs into interactive study materials. Built with Next.js 14, FastAPI, Supabase pgvector, and OpenAI.

## Features ✨

- **Upload Sources:** Extract text automatically from any YouTube URL (via transcripts) or PDF document.
- **Smart Flashcards:** Generates 10-15 key question/answer flashcards from the material.
- **Interactive Quizzes:** Dynamic multiple-choice quizzes with AI-generated options and scoring.
- **RAG Chat:** Stream AI responses augmented with vector search across your document chunks.

## Architecture Diagram Explanation 🏗️

The system follows a clean separation of concerns:

1. **Frontend (Next.js 14 - App Router)**
   - Delivers a highly responsive, TailwindCSS-powered user interface.
   - Manages state using React Hooks and `localStorage` to pass `documentId` across sessions.
   - Stream parser fetches SSE from the backend for real-time chat.

2. **Backend (FastAPI)**
   - Acts as the orchestration layer and entry point for the frontend.
   - Utilizes `PyMuPDF` and `youtube-transcript-api` for raw text extraction.
   - Triggers `tiktoken` to split text into overlapping chunks (700 tokens, 100 overlap).
   - Generates embeddings via OpenAI (`text-embedding-3-small`) and stores them in Supabase.
   - Exposes RESTful endpoints for generation (Structured JSON generation via `gpt-4o-mini`).

3. **Database (Supabase PostgreSQL + pgvector)**
   - Manages relational metadata (documents, chat history).
   - Utilizes `pgvector` extension with HNSW indexing to store and quickly perform cosine similarity searches against embedded chunks via custom RPC functions.

## Setup Instructions 🚀

### 1. Database Setup (Supabase)
Run the script `supabase/schema.sql` in your Supabase project's SQL Editor to set up tables, PGVector extension, indices, and RPC functions.

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
Fill in the `.env` variables with your OpenAI Key, Supabase URL, and Supabase Anon Key.
```bash
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

## Deployment Instructions 🌍

- **Backend:** Deploy the FastAPI app to services like Render, Heroku, or Railway. Ensure to set the environment variables exactly as in `.env`.
- **Frontend:** Deploy Next.js to Vercel or Netlify. Set `NEXT_PUBLIC_API_URL` to your live backend domain.
- **Database:** Supabase is fully managed. Keep your Production tokens secure.
