/**
 * Course file storage utilities.
 * - OLD files: served from external Supabase project (tpvwxfbcdqpwvdwcrluy) bucket "courses"
 * - NEW files: uploaded to Lovable Cloud bucket "course-files"
 */

import { supabase } from "@/integrations/supabase/client";

const EXTERNAL_STORAGE_BASE =
  "https://tpvwxfbcdqpwvdwcrluy.supabase.co/storage/v1";
const EXTERNAL_BUCKET = "courses";

const LOVABLE_CLOUD_BUCKET = "course-files";

/**
 * Build external public URL (for files known to be on the old bucket)
 */
export function getExternalCourseUrl(filePath: string): string {
  if (filePath.startsWith("http")) return filePath;
  return `${EXTERNAL_STORAGE_BASE}/object/public/${EXTERNAL_BUCKET}/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
}

/**
 * Get a public URL for a course file (sync version — returns Lovable Cloud URL).
 * Use resolveCourseUrl for smart fallback.
 */
export function getCoursePublicUrl(filePath: string): string {
  if (filePath.startsWith("http")) return filePath;

  const { data } = supabase.storage
    .from(LOVABLE_CLOUD_BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl ?? getExternalCourseUrl(filePath);
}

/**
 * Async version that checks Lovable Cloud first, falls back to external bucket.
 * Use this when opening/viewing a course to ensure the correct URL is resolved.
 */
export async function resolveCourseUrl(filePath: string): Promise<string> {
  if (filePath.startsWith("http")) return filePath;

  // Get a signed URL (bypasses public/private bucket restriction)
  const { data, error } = await supabase.storage
    .from(LOVABLE_CLOUD_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (!error && data?.signedUrl) {
    // HEAD on the signed URL: 200 = file exists, 400/404 = file absent
    try {
      const res = await fetch(data.signedUrl, { method: "HEAD" });
      if (res.ok) return data.signedUrl;
    } catch {
      // network error, try external
    }
  }

  // Fall back to external bucket (old Supabase project)
  return getExternalCourseUrl(filePath);
}

/** Upload a file to Lovable Cloud course-files bucket */
export async function uploadCourseFile(
  filePath: string,
  file: File
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(LOVABLE_CLOUD_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || "Upload error" };
  }
}

/** Delete a file from Lovable Cloud course-files bucket */
export async function deleteCourseFile(filePath: string): Promise<void> {
  try {
    await supabase.storage.from(LOVABLE_CLOUD_BUCKET).remove([filePath]);
  } catch {
    // Silent fail on delete
  }
}
