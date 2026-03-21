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
 * Get a public URL for a course file.
 * Handles both old external paths and new Lovable Cloud paths.
 */
export function getCoursePublicUrl(filePath: string): string {
  // If it's already a full URL, return as-is
  if (filePath.startsWith("http")) return filePath;

  // Try Lovable Cloud bucket first (new uploads)
  const { data } = supabase.storage
    .from(LOVABLE_CLOUD_BUCKET)
    .getPublicUrl(filePath);

  if (data?.publicUrl) return data.publicUrl;

  // Fallback to external bucket (old uploads)
  return `${EXTERNAL_STORAGE_BASE}/object/public/${EXTERNAL_BUCKET}/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
}

/**
 * Build external public URL (for files known to be on the old bucket)
 */
export function getExternalCourseUrl(filePath: string): string {
  if (filePath.startsWith("http")) return filePath;
  return `${EXTERNAL_STORAGE_BASE}/object/public/${EXTERNAL_BUCKET}/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
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
    // Try deleting from Lovable Cloud bucket
    await supabase.storage.from(LOVABLE_CLOUD_BUCKET).remove([filePath]);
  } catch {
    // Silent fail on delete
  }
}
