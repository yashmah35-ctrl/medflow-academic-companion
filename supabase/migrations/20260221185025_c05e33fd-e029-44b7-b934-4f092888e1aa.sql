
-- Add format and name columns to kholles table
ALTER TABLE public.kholles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.kholles ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'QCM';
