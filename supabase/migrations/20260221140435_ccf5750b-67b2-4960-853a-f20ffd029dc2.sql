
-- 1. User stats table for gamification (XP, streak, level)
CREATE TABLE public.user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_active_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add file_url column to courses for stored files
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS file_url text;

-- 3. Storage bucket for course files
INSERT INTO storage.buckets (id, name, public) VALUES ('course-files', 'course-files', true);

-- Storage policies: anyone can read, only medical_student can upload
CREATE POLICY "Anyone can read course files" ON storage.objects FOR SELECT USING (bucket_id = 'course-files');
CREATE POLICY "Medical students can upload course files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'medical_student'));
CREATE POLICY "Medical students can update course files" ON storage.objects FOR UPDATE USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'medical_student'));
CREATE POLICY "Medical students can delete course files" ON storage.objects FOR DELETE USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'medical_student'));

-- 4. Auto-create user_stats on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'medical_student'));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;
