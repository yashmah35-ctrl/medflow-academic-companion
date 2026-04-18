-- ============================================
-- SYSTÈME DE CRÉDITS IA
-- ============================================

-- 1. Table principale du solde
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  last_daily_claim date,
  last_subscription_reset_period_start timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON public.user_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.user_credits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Historique des transactions
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- positif = ajout, négatif = consommation
  reason text NOT NULL, -- 'subscription_reset', 'daily_bonus', 'ai_chat', 'pack_purchase', 'initial_grant'
  metadata jsonb DEFAULT '{}'::jsonb,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user_date
  ON public.credit_transactions(user_id, created_at DESC);

-- 3. Achats de packs de crédits
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text UNIQUE,
  pack_credits integer NOT NULL,
  amount_paid_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON public.credit_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
  ON public.credit_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Conversations IA
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.ai_conversations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Messages IA
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL, -- 'user' | 'assistant'
  content text NOT NULL,
  credits_spent integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
  ON public.ai_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);

-- ============================================
-- FONCTIONS RPC ATOMIQUES
-- ============================================

-- Initialise le solde si pas existant
CREATE OR REPLACE FUNCTION public.ensure_user_credits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Consomme N crédits de manière atomique. Retourne le nouveau solde, ou -1 si insuffisant.
CREATE OR REPLACE FUNCTION public.consume_credits(_user_id uuid, _amount integer, _reason text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
BEGIN
  PERFORM public.ensure_user_credits(_user_id);

  UPDATE public.user_credits
  SET balance = balance - _amount
  WHERE user_id = _user_id AND balance >= _amount
  RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RETURN -1; -- solde insuffisant
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata, balance_after)
  VALUES (_user_id, -_amount, _reason, _metadata, _new_balance);

  RETURN _new_balance;
END;
$$;

-- Rembourse N crédits (utilisé si l'IA échoue)
CREATE OR REPLACE FUNCTION public.refund_credits(_user_id uuid, _amount integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
BEGIN
  PERFORM public.ensure_user_credits(_user_id);

  UPDATE public.user_credits
  SET balance = balance + _amount
  WHERE user_id = _user_id
  RETURNING balance INTO _new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, reason, balance_after)
  VALUES (_user_id, _amount, _reason, _new_balance);

  RETURN _new_balance;
END;
$$;

-- Ajoute le crédit quotidien (1/jour). Retourne le nouveau solde ou NULL si déjà claim.
CREATE OR REPLACE FUNCTION public.claim_daily_credit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
  _today date := CURRENT_DATE;
BEGIN
  PERFORM public.ensure_user_credits(_user_id);

  UPDATE public.user_credits
  SET balance = balance + 1, last_daily_claim = _today
  WHERE user_id = _user_id AND (last_daily_claim IS NULL OR last_daily_claim < _today)
  RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, balance_after)
  VALUES (_user_id, 1, 'daily_bonus', _new_balance);

  RETURN _new_balance;
END;
$$;

-- Reset du solde à 4000 lors du renouvellement abonnement (ou si pas reset pour cette période)
CREATE OR REPLACE FUNCTION public.reset_subscription_credits(_user_id uuid, _period_start timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
  _already_reset boolean;
BEGIN
  PERFORM public.ensure_user_credits(_user_id);

  -- Vérifie si on a déjà reset pour cette période
  SELECT (last_subscription_reset_period_start IS NOT NULL
          AND last_subscription_reset_period_start >= _period_start)
  INTO _already_reset
  FROM public.user_credits WHERE user_id = _user_id;

  IF _already_reset THEN
    SELECT balance INTO _new_balance FROM public.user_credits WHERE user_id = _user_id;
    RETURN _new_balance;
  END IF;

  UPDATE public.user_credits
  SET balance = 4000, last_subscription_reset_period_start = _period_start
  WHERE user_id = _user_id
  RETURNING balance INTO _new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata, balance_after)
  VALUES (_user_id, 4000, 'subscription_reset', jsonb_build_object('period_start', _period_start), _new_balance);

  RETURN _new_balance;
END;
$$;

-- Ajoute des crédits achetés (pack one-time)
CREATE OR REPLACE FUNCTION public.add_purchased_credits(_user_id uuid, _amount integer, _stripe_session_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
BEGIN
  PERFORM public.ensure_user_credits(_user_id);

  UPDATE public.user_credits
  SET balance = balance + _amount
  WHERE user_id = _user_id
  RETURNING balance INTO _new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata, balance_after)
  VALUES (_user_id, _amount, 'pack_purchase', jsonb_build_object('stripe_session_id', _stripe_session_id), _new_balance);

  RETURN _new_balance;
END;
$$;

-- Initialise une ligne user_credits pour chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Initialise les utilisateurs existants à 0
INSERT INTO public.user_credits (user_id, balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;