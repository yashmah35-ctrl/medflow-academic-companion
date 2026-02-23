
-- Create bucket for question images
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload question images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'question-images');

-- Allow public read
CREATE POLICY "Public can read question images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'question-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete question images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'question-images');
