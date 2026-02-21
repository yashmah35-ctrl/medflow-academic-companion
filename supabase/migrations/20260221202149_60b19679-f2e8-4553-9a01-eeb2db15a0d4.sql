
-- Add source column to errors to distinguish origin
ALTER TABLE public.errors ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'kholle';

-- Add city column to annales
ALTER TABLE public.annales ADD COLUMN IF NOT EXISTS city text;

-- Add name column to annales for display name
ALTER TABLE public.annales ADD COLUMN IF NOT EXISTS name text;

-- Add format column to annales (QCM/QIM)
ALTER TABLE public.annales ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'QCM';

-- Add questions_json to annales for training
ALTER TABLE public.annales ADD COLUMN IF NOT EXISTS questions_json jsonb;

-- Add format column to exams (QCM/QIM) 
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'QCM';
