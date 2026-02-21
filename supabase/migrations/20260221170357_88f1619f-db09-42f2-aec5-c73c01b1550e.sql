
-- Allow authenticated users to upload files to course-files bucket
CREATE POLICY "Auth users can upload to course-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-files');

-- Allow authenticated users to update their course files
CREATE POLICY "Auth users can update course-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-files');

-- Allow authenticated users to delete their course files
CREATE POLICY "Auth users can delete course-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-files');
