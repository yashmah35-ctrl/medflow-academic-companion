
-- Allow authenticated users to update their own course progress rows.
-- The existing INSERT policy exists but upsert requires UPDATE permission
-- when the (user_id, course_id) row already exists (ON CONFLICT).
CREATE POLICY "Users can update own progress"
  ON public.user_course_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
