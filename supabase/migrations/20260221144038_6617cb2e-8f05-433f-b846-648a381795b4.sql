
-- Allow all authenticated users to insert courses
DROP POLICY IF EXISTS "Medical students can manage courses" ON public.courses;

CREATE POLICY "Authenticated users can insert courses"
ON public.courses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update courses"
ON public.courses FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete courses"
ON public.courses FOR DELETE
USING (true);
