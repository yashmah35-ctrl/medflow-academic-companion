-- Create error_folders table for grouping medical errors freely
CREATE TABLE public.error_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.error_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own error folders"
  ON public.error_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own error folders"
  ON public.error_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own error folders"
  ON public.error_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own error folders"
  ON public.error_folders FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_error_folders_updated_at
  BEFORE UPDATE ON public.error_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add folder_id to medical_errors (nullable: erreur peut être hors dossier)
ALTER TABLE public.medical_errors
  ADD COLUMN folder_id UUID REFERENCES public.error_folders(id) ON DELETE SET NULL;

CREATE INDEX idx_medical_errors_folder_id ON public.medical_errors(folder_id);
CREATE INDEX idx_error_folders_user_id ON public.error_folders(user_id);