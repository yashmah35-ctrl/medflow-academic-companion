CREATE OR REPLACE FUNCTION public.apply_exercise_score_xp_award(
  _user_id uuid,
  _exercise_id uuid,
  _correct_count integer,
  _total_count integer,
  _activity_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _safe_correct integer;
  _safe_total integer;
  _score_xp integer;
  _base_xp_to_add integer;
  _final_xp_to_add integer := 0;
  _award public.user_exercise_xp_awards%ROWTYPE;
  _current public.user_stats%ROWTYPE;
  _new_streak integer;
  _diff_days integer;
  _streak_multiplier numeric := 1;
  _new_xp integer;
  _new_level integer := 1;
  _thresholds integer[] := ARRAY[0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  _i integer;
BEGIN
  IF _user_id IS NULL OR _exercise_id IS NULL THEN
    RETURN jsonb_build_object('xpToAdd', 0, 'xpGained', 0);
  END IF;

  _safe_total := GREATEST(0, COALESCE(_total_count, 0));
  _safe_correct := GREATEST(0, LEAST(_safe_total, COALESCE(_correct_count, 0)));
  _score_xp := 5 + _safe_correct * 2;

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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suivi XP exercice introuvable';
  END IF;

  _base_xp_to_add := GREATEST(0, _score_xp - COALESCE(_award.awarded_xp, 0));

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

  IF _base_xp_to_add > 0 THEN
    _new_streak := _current.streak_days;

    IF _current.last_active_date IS DISTINCT FROM _activity_date THEN
      IF _current.last_active_date IS NULL THEN
        _new_streak := 1;
      ELSE
        _diff_days := _activity_date - _current.last_active_date;
        IF _diff_days = 1 THEN
          _new_streak := _current.streak_days + 1;
        ELSIF _diff_days = 0 THEN
          _new_streak := _current.streak_days;
        ELSE
          _new_streak := 1;
        END IF;
      END IF;
    END IF;

    _streak_multiplier := 1 + LEAST(_new_streak, 7) * 0.1;
    _final_xp_to_add := ROUND(_base_xp_to_add * _streak_multiplier)::integer;
    _new_xp := _current.xp + _final_xp_to_add;

    FOR _i IN 2..array_length(_thresholds, 1) LOOP
      IF _new_xp >= _thresholds[_i] THEN
        _new_level := _i;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    UPDATE public.user_exercise_xp_awards
    SET best_correct_count = GREATEST(best_correct_count, _safe_correct),
        total_count = GREATEST(total_count, _safe_total),
        awarded_xp = GREATEST(awarded_xp, _score_xp),
        updated_at = now()
    WHERE id = _award.id
    RETURNING * INTO _award;

    UPDATE public.user_stats
    SET xp = _new_xp,
        level = _new_level,
        streak_days = _new_streak,
        last_active_date = _activity_date,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO _current;
  END IF;

  RETURN jsonb_build_object(
    'xpToAdd', _base_xp_to_add,
    'xpGained', _final_xp_to_add,
    'streakMultiplier', _streak_multiplier,
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
$$;

REVOKE ALL ON FUNCTION public.apply_exercise_score_xp_award(uuid, uuid, integer, integer, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_exercise_score_xp_award(uuid, uuid, integer, integer, date) FROM anon;
REVOKE ALL ON FUNCTION public.apply_exercise_score_xp_award(uuid, uuid, integer, integer, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_exercise_score_xp_award(uuid, uuid, integer, integer, date) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_user_exercise_score_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.apply_exercise_score_xp_award(
    NEW.user_id,
    NEW.exercise_id,
    NEW.correct_count,
    NEW.total_count,
    COALESCE(NEW.completed_at::date, CURRENT_DATE)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_user_exercise_score_xp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_user_exercise_score_xp() FROM anon;
REVOKE ALL ON FUNCTION public.handle_user_exercise_score_xp() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_exercise_score_xp() TO service_role;

DROP TRIGGER IF EXISTS trg_user_exercise_score_xp ON public.user_exercise_scores;
CREATE TRIGGER trg_user_exercise_score_xp
AFTER INSERT ON public.user_exercise_scores
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_exercise_score_xp();

CREATE OR REPLACE FUNCTION public.record_exercise_score_with_xp(_exercise_id uuid, _correct_count integer, _total_count integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _before_xp integer := 0;
  _after public.user_stats%ROWTYPE;
  _award public.user_exercise_xp_awards%ROWTYPE;
  _safe_total integer;
  _safe_correct integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF _exercise_id IS NULL THEN
    RAISE EXCEPTION 'Exercice manquant';
  END IF;

  _safe_total := GREATEST(0, COALESCE(_total_count, 0));
  _safe_correct := GREATEST(0, LEAST(_safe_total, COALESCE(_correct_count, 0)));

  SELECT COALESCE(xp, 0)
  INTO _before_xp
  FROM public.user_stats
  WHERE user_id = _user_id;

  _before_xp := COALESCE(_before_xp, 0);

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

  SELECT *
  INTO _after
  FROM public.user_stats
  WHERE user_id = _user_id;

  SELECT *
  INTO _award
  FROM public.user_exercise_xp_awards
  WHERE user_id = _user_id
    AND exercise_id = _exercise_id;

  RETURN jsonb_build_object(
    'xpToAdd', GREATEST(0, COALESCE(_award.awarded_xp, 0) - (5 + _safe_correct * 2) + GREATEST(0, _after.xp - _before_xp)),
    'xpGained', GREATEST(0, COALESCE(_after.xp, 0) - _before_xp),
    'streakMultiplier', 1,
    'awardedXp', COALESCE(_award.awarded_xp, 0),
    'bestCorrectCount', COALESCE(_award.best_correct_count, 0),
    'correctCount', _safe_correct,
    'totalCount', _safe_total,
    'xp', COALESCE(_after.xp, 0),
    'level', COALESCE(_after.level, 1),
    'streakDays', COALESCE(_after.streak_days, 0),
    'lastActiveDate', _after.last_active_date
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_exercise_score_with_xp(uuid, integer, integer) TO service_role;

DO $$
DECLARE
  _score record;
BEGIN
  FOR _score IN
    SELECT s.user_id, s.exercise_id, s.correct_count, s.total_count, s.completed_at
    FROM public.user_exercise_scores s
    WHERE s.completed_at::date = CURRENT_DATE
    ORDER BY s.completed_at ASC
  LOOP
    PERFORM public.apply_exercise_score_xp_award(
      _score.user_id,
      _score.exercise_id,
      _score.correct_count,
      _score.total_count,
      COALESCE(_score.completed_at::date, CURRENT_DATE)
    );
  END LOOP;
END;
$$;