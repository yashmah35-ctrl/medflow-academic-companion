GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_stats TO authenticated;
GRANT ALL ON TABLE public.user_stats TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_exercise_scores TO authenticated;
GRANT ALL ON TABLE public.user_exercise_scores TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_revision_scores TO authenticated;
GRANT ALL ON TABLE public.user_revision_scores TO service_role;