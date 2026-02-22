
-- Create announcements table for admin messages
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_roles TEXT[] NOT NULL DEFAULT '{}',
  link_url TEXT,
  attachment_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'prepa_du_peuple')
  OR created_by = auth.uid()
);

-- Users can read announcements targeted to their role
CREATE POLICY "Users can read targeted announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (
  'all' = ANY(target_roles)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text = ANY(target_roles)
  )
);

-- Create user notification read status table
CREATE TABLE public.user_announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.user_announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reads"
ON public.user_announcement_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reads"
ON public.user_announcement_reads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
