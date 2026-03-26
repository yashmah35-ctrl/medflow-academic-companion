
ALTER TABLE public.schedule_blocks 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS start_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS end_hour integer,
ADD COLUMN IF NOT EXISTS end_minutes integer DEFAULT 0;
