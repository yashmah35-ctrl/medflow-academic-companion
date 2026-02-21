
-- Fix folders: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "All can read folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can insert folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can update folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can delete folders" ON public.folders;

CREATE POLICY "All can read folders" ON public.folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert folders" ON public.folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update folders" ON public.folders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete folders" ON public.folders FOR DELETE TO authenticated USING (true);

-- Fix courses: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "All can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can update courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can delete courses" ON public.courses;

CREATE POLICY "All can read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update courses" ON public.courses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete courses" ON public.courses FOR DELETE TO authenticated USING (true);
