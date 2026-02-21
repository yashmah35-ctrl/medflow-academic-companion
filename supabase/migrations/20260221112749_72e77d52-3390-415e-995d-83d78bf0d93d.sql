
-- Update app_role enum to support new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pass';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lass';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'college';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lycee';
