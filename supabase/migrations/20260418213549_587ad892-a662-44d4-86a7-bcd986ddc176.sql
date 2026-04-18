
-- ============================================
-- 1. STORAGE: bucket avatars (public)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 2. PROFILES: ajout avatar, username, iban
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS iban_encrypted text,
  ADD COLUMN IF NOT EXISTS bic text;

-- ============================================
-- 3. AFFILIATES: distinguer influencer vs user
-- ============================================
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS affiliate_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS pending_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid_out numeric NOT NULL DEFAULT 0;

-- Contrainte: type = 'influencer' OR 'user'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_type_check'
  ) THEN
    ALTER TABLE public.affiliates
      ADD CONSTRAINT affiliates_type_check CHECK (affiliate_type IN ('influencer', 'user'));
  END IF;
END $$;

-- Index unique sur user_id (un seul code auto par user)
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_user_id_unique
  ON public.affiliates(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 4. AFFILIATE_SUBSCRIPTIONS: ajouter status pending/validated
-- ============================================
ALTER TABLE public.affiliate_subscriptions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_sub_status_check'
  ) THEN
    ALTER TABLE public.affiliate_subscriptions
      ADD CONSTRAINT affiliate_sub_status_check CHECK (status IN ('pending', 'validated', 'cancelled'));
  END IF;
END $$;

-- Permettre aux users de voir leurs propres parrainages (gains)
DROP POLICY IF EXISTS "Affiliates can read own subs" ON public.affiliate_subscriptions;
CREATE POLICY "Affiliates can read own subs"
ON public.affiliate_subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_subscriptions.affiliate_id
      AND a.user_id = auth.uid()
  )
);

-- Permettre aux users de voir leur propre fiche affilié
DROP POLICY IF EXISTS "Users can read own affiliate" ON public.affiliates;
CREATE POLICY "Users can read own affiliate"
ON public.affiliates FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 5. AFFILIATE_PAYOUTS: historique des versements
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  paid_by uuid NOT NULL,
  payment_method text NOT NULL DEFAULT 'manual_transfer',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage payouts" ON public.affiliate_payouts;
CREATE POLICY "Admin can manage payouts"
ON public.affiliate_payouts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'prepa_du_peuple'::app_role))
WITH CHECK (has_role(auth.uid(), 'prepa_du_peuple'::app_role));

DROP POLICY IF EXISTS "Affiliates can read own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can read own payouts"
ON public.affiliate_payouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_payouts.affiliate_id
      AND a.user_id = auth.uid()
  )
);

-- ============================================
-- 6. FUNCTION: génération code parrainage unique
-- Format: PREFIX-AaBbCc12!@ (4 maj + 4 min + 1 chiffre + 1 spécial mélangés sur 10)
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uppers text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  lowers text := 'abcdefghjkmnpqrstuvwxyz';
  digits text := '23456789';
  specials text := '!@#$%&*';
  chars char[];
  i int;
  result text;
  final_code text;
  attempts int := 0;
  prefix_clean text;
BEGIN
  -- Nettoyer le préfixe (uniquement A-Z, max 8 chars)
  prefix_clean := upper(regexp_replace(coalesce(_prefix, 'USER'), '[^a-zA-Z]', '', 'g'));
  IF length(prefix_clean) = 0 THEN prefix_clean := 'USER'; END IF;
  IF length(prefix_clean) > 8 THEN prefix_clean := substring(prefix_clean, 1, 8); END IF;

  LOOP
    attempts := attempts + 1;
    -- 4 majuscules + 4 minuscules + 1 chiffre + 1 spécial
    chars := ARRAY[]::char[];
    FOR i IN 1..4 LOOP
      chars := array_append(chars, substring(uppers, 1 + floor(random() * length(uppers))::int, 1)::char);
    END LOOP;
    FOR i IN 1..4 LOOP
      chars := array_append(chars, substring(lowers, 1 + floor(random() * length(lowers))::int, 1)::char);
    END LOOP;
    chars := array_append(chars, substring(digits, 1 + floor(random() * length(digits))::int, 1)::char);
    chars := array_append(chars, substring(specials, 1 + floor(random() * length(specials))::int, 1)::char);

    -- Mélanger (Fisher-Yates simple)
    FOR i IN REVERSE 10..2 LOOP
      DECLARE j int := 1 + floor(random() * i)::int; tmp char;
      BEGIN
        tmp := chars[i]; chars[i] := chars[j]; chars[j] := tmp;
      END;
    END LOOP;

    result := array_to_string(chars, '');
    final_code := prefix_clean || '-' || result;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE code = final_code);
    EXIT WHEN attempts > 20;
  END LOOP;

  RETURN final_code;
END;
$$;

-- ============================================
-- 7. FUNCTION: ensure_user_affiliate (auto-create code)
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_user_affiliate(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing uuid;
  _username text;
  _new_code text;
  _new_id uuid;
BEGIN
  SELECT id INTO _existing FROM public.affiliates WHERE user_id = _user_id;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  -- Récupérer un préfixe basé sur username/full_name
  SELECT COALESCE(NULLIF(username, ''), NULLIF(full_name, ''), 'USER')
    INTO _username FROM public.profiles WHERE user_id = _user_id;
  IF _username IS NULL THEN _username := 'USER'; END IF;

  _new_code := public.generate_affiliate_code(_username);

  INSERT INTO public.affiliates (
    code, influencer_name, influencer_email, user_id, affiliate_type,
    discount_amount, commission_per_subscriber, is_active
  ) VALUES (
    _new_code, _username, NULL, _user_id, 'user',
    0.50, 0.50, true
  )
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- ============================================
-- 8. FUNCTION: validate_affiliate_commission
-- À appeler après paiement Stripe réussi
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_affiliate_commission(
  _subscriber_user_id uuid,
  _stripe_payment_intent_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub_record record;
BEGIN
  -- Trouver le parrainage en attente pour ce user
  SELECT * INTO _sub_record
  FROM public.affiliate_subscriptions
  WHERE subscriber_user_id = _subscriber_user_id
    AND status = 'pending'
  ORDER BY subscribed_at DESC
  LIMIT 1;

  IF _sub_record IS NULL THEN
    RETURN;
  END IF;

  -- Valider la commission
  UPDATE public.affiliate_subscriptions
  SET status = 'validated',
      validated_at = now(),
      stripe_payment_intent_id = COALESCE(_stripe_payment_intent_id, stripe_payment_intent_id)
  WHERE id = _sub_record.id;

  -- Créditer l'affilié (pending_balance)
  UPDATE public.affiliates
  SET total_subscribers = total_subscribers + 1,
      total_commission_earned = total_commission_earned + _sub_record.commission_amount,
      pending_balance = pending_balance + _sub_record.commission_amount
  WHERE id = _sub_record.affiliate_id;
END;
$$;

-- ============================================
-- 9. FUNCTION: record_affiliate_payout (admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.record_affiliate_payout(
  _affiliate_id uuid,
  _amount numeric,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payout_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'prepa_du_peuple'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.affiliate_payouts (affiliate_id, amount, paid_by, notes)
  VALUES (_affiliate_id, _amount, auth.uid(), _notes)
  RETURNING id INTO _payout_id;

  UPDATE public.affiliates
  SET pending_balance = GREATEST(0, pending_balance - _amount),
      total_paid_out = total_paid_out + _amount
  WHERE id = _affiliate_id;

  RETURN _payout_id;
END;
$$;

-- ============================================
-- 10. UPDATE: handle_new_user pour créer profile.username
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'medical_student'));

  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;
