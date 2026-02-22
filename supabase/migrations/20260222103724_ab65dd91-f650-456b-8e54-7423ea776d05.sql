
-- Add mastery score and algorithm columns to errors table
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS mastery_score integer NOT NULL DEFAULT 0;
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS consecutive_wrong integer NOT NULL DEFAULT 0;
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS total_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS last_response_time_ms integer DEFAULT NULL;
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false;
