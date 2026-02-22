
-- 1. Delete orphan folders with no owner (created before migration)
DELETE FROM folders WHERE created_by IS NULL;

-- 2. Drop all existing folder policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "All can read folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view own and public folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can insert folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;

-- SELECT: see own folders + public folders
CREATE POLICY "Users can view own and public folders"
ON public.folders FOR SELECT
TO authenticated
USING (is_public = true OR created_by = auth.uid());

-- INSERT: authenticated users can create folders (created_by must be self)
CREATE POLICY "Users can create folders"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: only own folders
CREATE POLICY "Users can update own folders"
ON public.folders FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- DELETE: only own folders
CREATE POLICY "Users can delete own folders"
ON public.folders FOR DELETE
TO authenticated
USING (created_by = auth.uid());
