
-- Add propositions_json column to store original question propositions from kholles/exams/annales
ALTER TABLE public.errors ADD COLUMN propositions_json jsonb NULL;

COMMENT ON COLUMN public.errors.propositions_json IS 'Stores the original propositions array [{id, text, isCorrect}] from the source question';
