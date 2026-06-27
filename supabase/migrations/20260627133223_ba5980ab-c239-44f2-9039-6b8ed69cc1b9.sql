CREATE POLICY "Users can update own progress"
  ON public.user_course_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);