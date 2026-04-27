-- New table for the redesigned medical error notebook (manual entries with SRS)
CREATE TABLE public.medical_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  explanation TEXT NOT NULL,
  is_true BOOLEAN NOT NULL DEFAULT false,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medical errors"
  ON public.medical_errors FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical errors"
  ON public.medical_errors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical errors"
  ON public.medical_errors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical errors"
  ON public.medical_errors FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_medical_errors_user_review ON public.medical_errors(user_id, next_review);
CREATE INDEX idx_medical_errors_user_subject ON public.medical_errors(user_id, subject);

CREATE TRIGGER update_medical_errors_updated_at
  BEFORE UPDATE ON public.medical_errors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();