-- Add course_id to admin_exercises to allow per-course exercise scoping
ALTER TABLE public.admin_exercises
ADD COLUMN course_id uuid;

CREATE INDEX IF NOT EXISTS idx_admin_exercises_course_id ON public.admin_exercises(course_id);
CREATE INDEX IF NOT EXISTS idx_admin_exercises_subject_id ON public.admin_exercises(subject_id);