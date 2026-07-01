REVOKE ALL ON public.user_exercise_scores FROM anon;
REVOKE ALL ON public.user_exercise_xp_awards FROM anon;
REVOKE ALL ON public.user_stats FROM anon;

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can read own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;

CREATE POLICY "Users can insert own stats"
ON public.user_stats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.user_stats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);