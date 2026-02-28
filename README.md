# AI Learning Assistant 🧠✨

A production-ready, highly interactive EdTech platform that transforms any PDF or YouTube video into a personalized AI curriculum. 
Built with Next.js, FastAPI, Supabase, Groq, and Gemini.

---

## 🚀 Features by Tier

### Tier 1: Core Functionality (The Foundation)
* **Smart Uploads:** Instantly parse and chunk text from PDFs or extract transcripts directly from any YouTube URL.
* **Vector Embeddings (Gemini):** Text chunks are embedded via Google's Gemini-1.5 API and stored in a Supabase pgvector database for high-speed similarity search.
* **Study Material Generation (Groq):** One-click generation of interactive Flashcards and dynamic Multiple-Choice Quizzes with difficulty scaling (Easy/Medium/Hard).
* **Neural Network Chat:** A context-aware chat interface utilizing RAG (Retrieval-Augmented Generation) so the AI only answers based on the uploaded document.

### Tier 2: The "Premium" Experience (UX & Interactivity)
* **Voice Interactions:** 
  * 🎙️ **Speech-to-Text:** Speak your questions into the chat using the native Web Speech API.
  * 🔊 **Text-to-Speech:** The AI can optionally read its streaming responses out loud in real-time.
* **AI Notes Improver:** Paste rough, unstructured thoughts, and Groq will dynamically restructure them, fix grammar, and output beautiful markdown.
* **Exam Mode:** Add a strict 30-minute pulsing countdown timer to Quizzes. Auto-submits when time runs out.
* **Interactive Mind Maps:** An auto-generating Knowledge Graph (built with React Flow). Double-click nodes to trigger AI slide-out explanations, or teleport directly to the RAG chat for deep-dives.

### Tier 3: Architecture & Analytics
* **Progress Dashboard:** A centralized tracking hub utilizing `recharts` to plot quiz scores over time, time spent studying, and aggregate analytics.
* **The Library:** A global grid view of every uploaded document. Click to instantly resume previous sessions.
* **Adaptive Learning AI:** The backend records exactly which quiz questions you answered incorrectly. The next time you generate a quiz for that topic, the Groq system prompt is dynamically overridden to heavily bias new questions toward your documented weak areas.
* **Map-Reduce Instant Generation:** Large documents trigger an invisible background task that requests individual JSON summaries for every 700-word chunk concurrently, reduces them into a single "Master Summary", and pipes that into generation prompts for 1-second, hallucination-free output.

### Tier 4: The Ultimate AI Tutor
* **Personalized Learning Paths:** Input a high-level goal (e.g., "Learn Machine Learning" for "30 days"). The AI acts as a curriculum architect, generating a strict daily JSON roadmap saved to the database. Users click to check off days, driving a live progress bar.
* **Resumable Chat:** Session IDs are generated locally and pinned. All User and AI messages are intercepted mid-stream and saved to `chat_history`. Reloading the chat fetches the history.
* **Global Multi-Document RAG:** A toggle switch in the Chat UI allows the user to drop the current `document_id` filter. The custom Supabase RPC function performs a cosine-similarity sweep across *every single chunk from every single document* the user has ever uploaded simultaneously to answer cross-disciplinary questions.

---

## 🛠️ Tech Stack & Architecture

### Frontend
* **Next.js (App Router)** - React framework
* **TypeScript** - Type safety
* **Tailwind CSS / Inline Canvas** - Custom glassmorphism and animated particle backgrounds
* **React Flow** - For interactive Mind Map rendering
* **Recharts** - For Dashboard data visualization

### Backend
* **FastAPI (Python)** - High-performance async API server
* **Supabase** - PostgreSQL database with `pgvector` extension & RPC functions
* **Groq SDK** - For lightning-fast LLaMA-3 text generation (prompts, quizzes, JSON structuring)
* **Gemini SDK** - Exclusively for dense `text-embedding-004` vector generation
* **yt-dlp & youtube-transcript-api** - Video processing

---

## ⚙️ Local Development Setup

### 1. Database Setup (Supabase)
Create a new Supabase project and run the provided SQL schemas to generate the tables required for Vector Search, Documents, Quiz Attempts, Learning Paths, and Chat History.

### 2. Environment Variables
You will need API keys for Groq, Gemini, and Supabase.

**Backend (`backend/.env`):**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:3000
```

### 3. Run the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to interact with the AI Learning Assistant!
