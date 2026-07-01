CREATE OR REPLACE FUNCTION public.add_user_xp(_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _current public.user_stats%ROWTYPE;
  _today date := CURRENT_DATE;
  _new_streak integer;
  _diff_days integer;
  _streak_multiplier numeric;
  _final_xp integer;
  _new_xp integer;
  _new_level integer := 1;
  _thresholds integer[] := ARRAY[0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  _i integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF COALESCE(_amount, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'xpGained', 0,
      'streakMultiplier', 1,
      'xp', NULL,
      'level', NULL,
      'streakDays', NULL,
      'lastActiveDate', NULL
    );
  END IF;

  INSERT INTO public.user_stats (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _current
  FROM public.user_stats
  WHERE user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impossible de trouver ou créer les statistiques utilisateur';
  END IF;

  _new_streak := _current.streak_days;

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

  _streak_multiplier := 1 + LEAST(_new_streak, 7) * 0.1;
  _final_xp := ROUND(_amount * _streak_multiplier)::integer;
  _new_xp := _current.xp + _final_xp;

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

  RETURN jsonb_build_object(
    'xpGained', _final_xp,
    'streakMultiplier', _streak_multiplier,
    'xp', _current.xp,
    'level', _current.level,
    'streakDays', _current.streak_days,
    'lastActiveDate', _current.last_active_date
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_user_xp(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_user_xp(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_user_xp(integer) TO authenticated;