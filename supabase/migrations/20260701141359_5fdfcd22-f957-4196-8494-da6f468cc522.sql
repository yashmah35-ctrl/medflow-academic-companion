CREATE TABLE IF NOT EXISTS public.user_exercise_xp_awards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  best_correct_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  awarded_xp integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

GRANT SELECT, INSERT, UPDATE ON public.user_exercise_xp_awards TO authenticated;
GRANT ALL ON public.user_exercise_xp_awards TO service_role;

ALTER TABLE public.user_exercise_xp_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise xp awards" ON public.user_exercise_xp_awards;
CREATE POLICY "Users can read own exercise xp awards"
ON public.user_exercise_xp_awards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise xp awards" ON public.user_exercise_xp_awards;
CREATE POLICY "Users can insert own exercise xp awards"
ON public.user_exercise_xp_awards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exercise xp awards" ON public.user_exercise_xp_awards;
CREATE POLICY "Users can update own exercise xp awards"
ON public.user_exercise_xp_awards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_exercise_xp_awards_updated_at ON public.user_exercise_xp_awards;
CREATE TRIGGER update_user_exercise_xp_awards_updated_at
BEFORE UPDATE ON public.user_exercise_xp_awards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.record_exercise_score_with_xp(
  _exercise_id uuid,
  _correct_count integer,
  _total_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _safe_correct integer;
  _safe_total integer;
  _score_xp integer;
  _xp_to_add integer;
  _award public.user_exercise_xp_awards%ROWTYPE;
  _current public.user_stats%ROWTYPE;
  _today date := CURRENT_DATE;
  _new_streak integer;
  _diff_days integer;
  _new_xp integer;
  _new_level integer := 1;
  _thresholds integer[] := ARRAY[0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  _i integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF _exercise_id IS NULL THEN
    RAISE EXCEPTION 'Exercice manquant';
  END IF;

  _safe_total := GREATEST(0, COALESCE(_total_count, 0));
  _safe_correct := GREATEST(0, LEAST(_safe_total, COALESCE(_correct_count, 0)));
  _score_xp := 5 + _safe_correct * 2;

  INSERT INTO public.user_exercise_scores (
    user_id,
    exercise_id,
    correct_count,
    total_count
  ) VALUES (
    _user_id,
    _exercise_id,
    _safe_correct,
    _safe_total
  );

  INSERT INTO public.user_exercise_xp_awards (
    user_id,
    exercise_id,
    best_correct_count,
    total_count,
    awarded_xp
  ) VALUES (
    _user_id,
    _exercise_id,
    0,
    _safe_total,
    0
  )
  ON CONFLICT (user_id, exercise_id) DO NOTHING;

  SELECT *
  INTO _award
  FROM public.user_exercise_xp_awards
  WHERE user_id = _user_id
    AND exercise_id = _exercise_id
  FOR UPDATE;

  _xp_to_add := GREATEST(0, _score_xp - COALESCE(_award.awarded_xp, 0));

  IF _xp_to_add > 0 THEN
    UPDATE public.user_exercise_xp_awards
    SET best_correct_count = GREATEST(best_correct_count, _safe_correct),
        total_count = GREATEST(total_count, _safe_total),
        awarded_xp = _score_xp,
        updated_at = now()
    WHERE id = _award.id
    RETURNING * INTO _award;
  END IF;

  INSERT INTO public.user_stats (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO _current
  FROM public.user_stats
  WHERE user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Statistiques utilisateur introuvables';
  END IF;

  _new_streak := _current.streak_days;

  IF _xp_to_add > 0 THEN
    IF _current.last_active_date IS DISTINCT FROM _today THEN
      IF _current.last_active_date IS NULL THEN
        _new_streak := 1;
      ELSE
        _diff_days := _today - _current.last_active_date;
        IF _diff_days = 1 THEN
          _new_streak := _current.streak_days + 1;
        ELSIF _diff_days = 0 THEN
          _new_streak := _current.streak_days;
        ELSE
          _new_streak := 1;
        END IF;
      END IF;
    END IF;

    _new_xp := _current.xp + _xp_to_add;

    FOR _i IN 2..array_length(_thresholds, 1) LOOP
      IF _new_xp >= _thresholds[_i] THEN
        _new_level := _i;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    UPDATE public.user_stats
    SET xp = _new_xp,
        level = _new_level,
        streak_days = _new_streak,
        last_active_date = _today,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO _current;
  END IF;

  RETURN jsonb_build_object(
    'xpToAdd', _xp_to_add,
    'xpGained', _xp_to_add,
    'awardedXp', COALESCE(_award.awarded_xp, 0),
    'bestCorrectCount', COALESCE(_award.best_correct_count, 0),
    'correctCount', _safe_correct,
    'totalCount', _safe_total,
    'xp', _current.xp,
    'level', _current.level,
    'streakDays', _current.streak_days,
    'lastActiveDate', _current.last_active_date
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO service_role;