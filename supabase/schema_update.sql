-- Tier 3 Updates: Advanced Map-Reduce Prompts

-- 1. Add Master Summary caching to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS master_summary TEXT;
