
CREATE TABLE public.user_exercise_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  correct_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_exercise_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exercise scores"
  ON public.user_exercise_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own exercise scores"
  ON public.user_exercise_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
