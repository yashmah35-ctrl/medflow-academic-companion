GRANT SELECT, INSERT ON public.user_exercise_scores TO authenticated;
GRANT ALL ON public.user_exercise_scores TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_exercise_xp_awards TO authenticated;
GRANT ALL ON public.user_exercise_xp_awards TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;

DROP POLICY IF EXISTS "Users can read own stats" ON public.user_stats;
CREATE POLICY "Authenticated users can read leaderboard stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);

GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM anon;

GRANT EXECUTE ON FUNCTION public.add_user_xp(integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.add_user_xp(integer) FROM anon;