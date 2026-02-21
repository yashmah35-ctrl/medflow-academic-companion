
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('medical_student', 'lyceen');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'medical_student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  university TEXT,
  ent_login_encrypted TEXT,
  ent_password_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'chemistry',
  icon TEXT NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Folders
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  course_count INT NOT NULL DEFAULT 0,
  exercise_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT NOT NULL DEFAULT 'fac' CHECK (source IN ('fac', 'bonus')),
  reading_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Schedule blocks
CREATE TABLE public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Découverte',
  scheduled_date DATE NOT NULL,
  start_hour INT NOT NULL DEFAULT 8,
  duration_minutes INT NOT NULL DEFAULT 60,
  completed BOOLEAN NOT NULL DEFAULT false,
  deleted_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Errors (error notebook)
CREATE TABLE public.errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_name TEXT,
  question TEXT NOT NULL,
  wrong_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  occurrence_count INT NOT NULL DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.errors ENABLE ROW LEVEL SECURITY;

-- Kholles
CREATE TABLE public.kholles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  date DATE,
  questions_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kholles ENABLE ROW LEVEL SECURITY;

-- Exams
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE,
  questions_json JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Annales
CREATE TABLE public.annales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  year TEXT,
  session TEXT,
  pages_json JSONB,
  analysis_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.annales ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'medical_student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles: users can CRUD their own
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- subjects: all authenticated can read
CREATE POLICY "All can read subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medical students can manage subjects" ON public.subjects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'medical_student'));

-- folders: all authenticated can read
CREATE POLICY "All can read folders" ON public.folders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medical students can manage folders" ON public.folders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'medical_student'));

-- courses: all authenticated can read (no download enforced at app level)
CREATE POLICY "All can read courses" ON public.courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medical students can manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'medical_student'));

-- schedule_blocks: users own data
CREATE POLICY "Users can read own schedule" ON public.schedule_blocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON public.schedule_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON public.schedule_blocks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON public.schedule_blocks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- errors: users own data
CREATE POLICY "Users can read own errors" ON public.errors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own errors" ON public.errors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own errors" ON public.errors
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own errors" ON public.errors
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- kholles: users own data
CREATE POLICY "Users can read own kholles" ON public.kholles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kholles" ON public.kholles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kholles" ON public.kholles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kholles" ON public.kholles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- exams: users own data
CREATE POLICY "Users can read own exams" ON public.exams
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- annales: users own data
CREATE POLICY "Users can read own annales" ON public.annales
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own annales" ON public.annales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annales" ON public.annales
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annales" ON public.annales
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notifications: users own data
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
