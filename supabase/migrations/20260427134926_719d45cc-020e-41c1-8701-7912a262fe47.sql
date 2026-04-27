CREATE TABLE public.qcm_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.qcm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own qcm sessions" ON public.qcm_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own qcm sessions" ON public.qcm_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own qcm sessions" ON public.qcm_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own qcm sessions" ON public.qcm_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_qcm_sessions_updated_at
BEFORE UPDATE ON public.qcm_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_qcm_sessions_user ON public.qcm_sessions(user_id, created_at DESC);