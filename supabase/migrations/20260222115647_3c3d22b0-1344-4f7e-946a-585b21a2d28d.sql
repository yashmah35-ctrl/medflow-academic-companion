
-- Add created_by and is_public columns to folders
ALTER TABLE public.folders ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.folders ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Update existing folders: set created_by to null (we don't know who created them)
-- Drop existing RLS policies on folders if any, then recreate
DROP POLICY IF EXISTS "Users can view folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can update folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can delete folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can view folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can insert folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can update folders" ON public.folders;
DROP POLICY IF EXISTS "Anyone can delete folders" ON public.folders;

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see their own folders + all public folders
CREATE POLICY "Users can view own and public folders"
ON public.folders FOR SELECT
TO authenticated
USING (is_public = true OR created_by = auth.uid());

-- INSERT: Authenticated users can create folders (role check done in app)
CREATE POLICY "Users can create folders"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: Users can update their own folders
CREATE POLICY "Users can update own folders"
ON public.folders FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- DELETE: Users can delete their own folders
CREATE POLICY "Users can delete own folders"
ON public.folders FOR DELETE
TO authenticated
USING (created_by = auth.uid());
