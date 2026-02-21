
-- Add new columns to errors table for enhanced error notebook
ALTER TABLE public.errors
ADD COLUMN IF NOT EXISTS error_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS personal_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mastered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS next_review timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS correction_count integer DEFAULT 0;
