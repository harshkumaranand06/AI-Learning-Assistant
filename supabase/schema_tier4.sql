-- Tier 4 Updates: The Ultimate AI Tutor

-- 1. Create table for Personalized Learning Paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal TEXT NOT NULL,
    timeframe_days INT NOT NULL,
    roadmap JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
