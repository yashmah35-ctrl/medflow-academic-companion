
-- Drop the restrictive ALL policy and replace with separate policies
DROP POLICY IF EXISTS "Medical students can manage folders" ON public.folders;

-- Allow all authenticated users to insert folders
CREATE POLICY "Authenticated users can insert folders"
ON public.folders FOR INSERT
WITH CHECK (true);

-- Allow all authenticated users to update folders
CREATE POLICY "Authenticated users can update folders"
ON public.folders FOR UPDATE
USING (true);

-- Allow all authenticated users to delete folders
CREATE POLICY "Authenticated users can delete folders"
ON public.folders FOR DELETE
USING (true);
