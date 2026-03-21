/**
 * External Supabase storage for course files.
 * Bucket "courses" on project tpvwxfbcdqpwvdwcrluy is PUBLIC.
 */

const EXTERNAL_STORAGE_BASE =
  "https://tpvwxfbcdqpwvdwcrluy.supabase.co/storage/v1";

const BUCKET = "courses";

/** Get a public URL for a file in the external courses bucket */
export function getCoursePublicUrl(filePath: string): string {
  return `${EXTERNAL_STORAGE_BASE}/object/public/${BUCKET}/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
}

/** Upload a file to the external courses bucket (uses public upload endpoint) */
export async function uploadCourseFile(
  filePath: string,
  file: File
): Promise<{ error: string | null }> {
  try {
    const url = `${EXTERNAL_STORAGE_BASE}/object/${BUCKET}/${filePath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        // Public bucket — use anon key for upload auth
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnd4ZmJjZHFwd3Zkd2NybHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzgzNTUsImV4cCI6MjA1NTU1NDM1NX0.sc6_x41sFNL-r0mGFUBR_SJu6wXSsKkYehLGmBKZl2M`,
      },
      body: file,
    });
    if (!res.ok) {
      const body = await res.text();
      return { error: body || `Upload failed (${res.status})` };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || "Upload error" };
  }
}

/** Delete a file from the external courses bucket */
export async function deleteCourseFile(filePath: string): Promise<void> {
  try {
    const url = `${EXTERNAL_STORAGE_BASE}/object/${BUCKET}/${filePath}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnd4ZmJjZHFwd3Zkd2NybHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzgzNTUsImV4cCI6MjA1NTU1NDM1NX0.sc6_x41sFNL-r0mGFUBR_SJu6wXSsKkYehLGmBKZl2M`,
      },
    });
  } catch {
    // Silent fail on delete
  }
}
