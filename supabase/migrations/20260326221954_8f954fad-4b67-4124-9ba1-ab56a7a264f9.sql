
-- Table to track when a user opens/views a course
CREATE TABLE public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  folder_id uuid NOT NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own progress"
  ON public.user_course_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own progress"
  ON public.user_course_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Table to track revision attempt scores (per question granularity)
CREATE TABLE public.user_revision_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  review_id uuid NOT NULL,
  folder_id uuid NOT NULL,
  correct_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_revision_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own revision scores"
  ON public.user_revision_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own revision scores"
  ON public.user_revision_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
