
-- Admin exercises: exercise sets created by admin, strictly linked to a subject
CREATE TABLE public.admin_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  format text NOT NULL DEFAULT 'QCM',
  questions_json jsonb DEFAULT '[]'::jsonb,
  source_label text DEFAULT NULL,
  score_label text DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_exercises ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "All authenticated can read admin_exercises"
  ON public.admin_exercises FOR SELECT
  TO authenticated
  USING (true);

-- Only admin (prepa_du_peuple role) can insert/update/delete
CREATE POLICY "Admin can manage admin_exercises"
  ON public.admin_exercises FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Chapter reviews: exercises linked to a specific course, errors NOT sent to error notebook
CREATE TABLE public.chapter_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Révision de chapitre',
  format text NOT NULL DEFAULT 'QCM',
  questions_json jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chapter_reviews ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "All authenticated can read chapter_reviews"
  ON public.chapter_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can manage
CREATE POLICY "Admin can manage chapter_reviews"
  ON public.chapter_reviews FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
