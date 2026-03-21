
CREATE TABLE public.schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  markers_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;

-- Everyone can read public schemas + own schemas
CREATE POLICY "Users can read public and own schemas"
ON public.schemas FOR SELECT TO authenticated
USING (is_public = true OR user_id = auth.uid());

-- Users can insert own schemas
CREATE POLICY "Users can insert own schemas"
ON public.schemas FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update own schemas
CREATE POLICY "Users can update own schemas"
ON public.schemas FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Users can delete own schemas
CREATE POLICY "Users can delete own schemas"
ON public.schemas FOR DELETE TO authenticated
USING (user_id = auth.uid());
