
-- 1. AFFILIATES: drop public exposure of sensitive fields
DROP POLICY IF EXISTS "All can read active affiliates" ON public.affiliates;
-- Keep: "Users can read own affiliate" + "Admin can manage affiliates"

-- 2. COURSES: restrict mutations to admin only
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can update courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can delete courses" ON public.courses;
CREATE POLICY "Admin can insert courses" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can update courses" ON public.courses
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can delete courses" ON public.courses
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));

-- 3. SUBJECTS: restrict mutations to admin only
DROP POLICY IF EXISTS "Medical students can manage subjects" ON public.subjects;
CREATE POLICY "Admin can manage subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));

-- 4. STORAGE course-files: restrict mutations to admin only
DROP POLICY IF EXISTS "Auth users can upload to course-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update course-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete course-files" ON storage.objects;
DROP POLICY IF EXISTS "Medical students can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Medical students can update course files" ON storage.objects;
DROP POLICY IF EXISTS "Medical students can delete course files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read course files" ON storage.objects;

CREATE POLICY "Admin can upload course files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can update course files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can delete course files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can list course files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'course-files' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
-- Public access remains via direct URL (public bucket)

-- 5. STORAGE question-images: restrict mutations to admin
DROP POLICY IF EXISTS "Authenticated users can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete question images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read question images" ON storage.objects;

CREATE POLICY "Admin can upload question images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can update question images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can delete question images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
CREATE POLICY "Admin can list question images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'question-images' AND public.has_role(auth.uid(), 'prepa_du_peuple'::app_role));
-- Public read via direct URL remains (public bucket)

-- 6. ANNOUNCEMENTS realtime: remove from publication (fetch-only)
ALTER PUBLICATION supabase_realtime DROP TABLE public.announcements;

-- 7. SECURITY DEFINER functions: revoke EXECUTE from anon/public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_credits(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_purchased_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_subscription_credits(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_affiliate_commission(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_affiliate_payout(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_affiliate_code(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_affiliate(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_daily_credit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_landing_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Re-grant only what the client/edge functions need
GRANT EXECUTE ON FUNCTION public.claim_daily_credit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_affiliate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_payout(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_credits(uuid) TO authenticated;
