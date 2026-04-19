-- Public counters for landing page (no auth required, no sensitive data exposed)
CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _users_count integer;
  _questions_count integer;
BEGIN
  -- Count confirmed users via profiles (which is created post-confirmation in handle_new_user)
  SELECT COUNT(*) INTO _users_count FROM public.profiles;

  -- Count questions across all sources (admin_exercises, chapter_reviews, kholles, annales, exams)
  SELECT
    COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.admin_exercises WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.chapter_reviews WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.kholles WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.annales WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.exams WHERE jsonb_typeof(questions_json) = 'array'), 0)
  INTO _questions_count;

  RETURN jsonb_build_object(
    'users_count', COALESCE(_users_count, 0),
    'questions_count', COALESCE(_questions_count, 0)
  );
END;
$$;

-- Allow anonymous + authenticated callers
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;