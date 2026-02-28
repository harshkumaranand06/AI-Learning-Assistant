-- Tier 4 Updates: Global Multi-Document RAG

-- 1. Create a global matching function that searches all chunks regardless of document_id
CREATE OR REPLACE FUNCTION public.match_document_chunks_global (
  query_embedding vector(768),
  match_count int DEFAULT 5
) RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
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
  -- We don't filter by document_id here, allowing global searches
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
