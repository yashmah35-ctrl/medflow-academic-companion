import { createClient } from '@supabase/supabase-js';

const EXTERNAL_URL = 'https://tpvwxfbcdqpwvdwcrluy.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnd4ZmJjZHFwd3Zkd2NybHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzY4MTQsImV4cCI6MjA4NzI1MjgxNH0.z2kI-0E15hwf2GQ_rK8BTkbM_OncoY2DNRO2sjxCfFM';

const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_ANON_KEY);

export async function syncUserToExternal(userId: string, email: string) {
  try {
    console.log('[ExternalSync] Syncing user:', userId, email);
    
    // Try upsert first
    const { data, error } = await externalSupabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          role: 'student',
        },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error('[ExternalSync] Upsert error:', error.message, error.details, error.hint);
      
      // If upsert fails, try insert (ignore conflict)
      const { error: insertError } = await externalSupabase
        .from('users')
        .insert({
          id: userId,
          email,
          created_at: new Date().toISOString(),
          role: 'student',
        });
      
      if (insertError) {
        // If it's a duplicate key error, that's fine - user already exists
        if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
          console.log('[ExternalSync] User already exists in external DB');
          return true;
        }
        console.error('[ExternalSync] Insert fallback error:', insertError.message);
        return false;
      }
    }
    
    console.log('[ExternalSync] User synced successfully:', data);
    return true;
  } catch (err) {
    console.error('[ExternalSync] Failed:', err);
    return false;
  }
}

export async function syncAllUsersToExternal(users: { id: string; email: string }[]) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    const success = await syncUserToExternal(user.id, user.email);
    if (success) successCount++;
    else errorCount++;
  }
  
  return { successCount, errorCount };
}
