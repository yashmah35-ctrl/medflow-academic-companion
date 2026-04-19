CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _users_count integer;
  _questions_count integer;
  _courses_count integer;
BEGIN
  SELECT COUNT(*) INTO _users_count FROM public.profiles;

  SELECT
    COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.admin_exercises WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.chapter_reviews WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.kholles WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.annales WHERE jsonb_typeof(questions_json) = 'array'), 0)
    + COALESCE((SELECT SUM(jsonb_array_length(COALESCE(questions_json, '[]'::jsonb))) FROM public.exams WHERE jsonb_typeof(questions_json) = 'array'), 0)
  INTO _questions_count;

  SELECT COUNT(*) INTO _courses_count FROM public.courses;

  RETURN jsonb_build_object(
    'users_count', COALESCE(_users_count, 0),
    'questions_count', COALESCE(_questions_count, 0),
    'courses_count', COALESCE(_courses_count, 0)
  );
END;
$function$;