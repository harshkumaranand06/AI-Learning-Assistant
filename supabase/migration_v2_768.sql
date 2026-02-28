-- Drop dependent objects (indexes and functions) first
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP FUNCTION IF EXISTS match_document_chunks(vector, int);
DROP FUNCTION IF EXISTS match_document_chunks(vector(1536), int);

-- Alter the column type to victor(768) (if the column doesn't exist, it will fail but that's safe for a migration)
ALTER TABLE public.document_chunks ALTER COLUMN embedding TYPE vector(768);

-- Recreate index
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- Recreate function
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
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
