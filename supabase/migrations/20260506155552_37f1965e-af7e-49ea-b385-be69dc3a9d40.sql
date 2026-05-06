ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS stripe_coupon_id text;
UPDATE public.affiliates SET stripe_coupon_id = 'BhFY7KF6' WHERE code = 'BBV_PHYSIO';