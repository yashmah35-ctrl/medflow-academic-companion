
-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  influencer_name text NOT NULL,
  influencer_email text,
  discount_amount numeric NOT NULL DEFAULT 0,
  commission_per_subscriber numeric NOT NULL DEFAULT 0,
  total_subscribers integer NOT NULL DEFAULT 0,
  total_commission_earned numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Admin can manage affiliates (prepa_du_peuple role)
CREATE POLICY "Admin can manage affiliates"
  ON public.affiliates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'prepa_du_peuple'))
  WITH CHECK (public.has_role(auth.uid(), 'prepa_du_peuple'));

-- All authenticated can read active affiliates (for code validation)
CREATE POLICY "All can read active affiliates"
  ON public.affiliates FOR SELECT TO authenticated
  USING (is_active = true);

-- Affiliate subscriptions table
CREATE TABLE public.affiliate_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  affiliate_code text NOT NULL,
  subscriber_user_id uuid NOT NULL,
  subscriber_email text,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  commission_amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false
);

ALTER TABLE public.affiliate_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin can manage affiliate subscriptions
CREATE POLICY "Admin can manage affiliate_subscriptions"
  ON public.affiliate_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'prepa_du_peuple'))
  WITH CHECK (public.has_role(auth.uid(), 'prepa_du_peuple'));
