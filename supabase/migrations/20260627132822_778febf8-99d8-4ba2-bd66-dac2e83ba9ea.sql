DROP POLICY IF EXISTS "Authenticated users can read course files" ON storage.objects;
CREATE POLICY "Authenticated users can read course files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-files');