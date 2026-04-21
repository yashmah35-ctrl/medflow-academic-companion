-- Table 1 : Parcours MENTOR générés par l'IA (1 row par cours)
CREATE TABLE public.mentor_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL UNIQUE,
  subject_id UUID NOT NULL,
  chapter_title TEXT NOT NULL,
  exercises_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  qcm_final_json JSONB,
  generated_by UUID NOT NULL,
  generation_model TEXT DEFAULT 'google/gemini-2.5-pro',
  source_text_length INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read mentor_chapters"
  ON public.mentor_chapters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage mentor_chapters"
  ON public.mentor_chapters FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'prepa_du_peuple'::app_role))
  WITH CHECK (has_role(auth.uid(), 'prepa_du_peuple'::app_role));

CREATE INDEX idx_mentor_chapters_course ON public.mentor_chapters(course_id);

CREATE TRIGGER update_mentor_chapters_updated_at
  BEFORE UPDATE ON public.mentor_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 2 : Progression étudiant par exercice
CREATE TABLE public.mentor_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  exercise_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  score INTEGER,
  stars INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER,
  is_qcm_final BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INTEGER,
  profile_snapshot JSONB,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, exercise_id)
);

ALTER TABLE public.mentor_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mentor progress"
  ON public.mentor_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentor progress"
  ON public.mentor_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentor progress"
  ON public.mentor_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_mentor_progress_user_course ON public.mentor_progress(user_id, course_id);

CREATE TRIGGER update_mentor_progress_updated_at
  BEFORE UPDATE ON public.mentor_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 3 : Profil étudiant MENTOR (1 row par user, global)
CREATE TABLE public.mentor_student_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  confidence_level INTEGER NOT NULL DEFAULT 5,
  chapter_status TEXT NOT NULL DEFAULT 'skimmed',
  session_type TEXT NOT NULL DEFAULT 'deep',
  learning_mode TEXT NOT NULL DEFAULT 'connections',
  exam_type TEXT,
  exam_date DATE,
  completed_diagnostic BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_student_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mentor profile"
  ON public.mentor_student_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentor profile"
  ON public.mentor_student_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentor profile"
  ON public.mentor_student_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_mentor_student_profile_updated_at
  BEFORE UPDATE ON public.mentor_student_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 4 : Badges débloqués
CREATE TABLE public.mentor_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.mentor_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON public.mentor_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.mentor_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_mentor_badges_user ON public.mentor_badges(user_id);