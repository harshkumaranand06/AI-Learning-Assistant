-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store processed documents (PDFs, YouTube videos)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL, -- 'pdf' or 'youtube'
    source_url TEXT, -- YouTube URL or filename
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store document chunks and their embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB, -- stores page number, timestamp etc
    embedding vector(1536), -- text-embedding-3-small uses 1536 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index to speed up similarity searches using HNSW (Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- Table to store user queries and chat history
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(1536),
  match_count int DEFAULT 5
) RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
