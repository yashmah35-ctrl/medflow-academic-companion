REVOKE EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO service_role;