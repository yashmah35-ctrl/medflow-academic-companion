import { createClient } from '@supabase/supabase-js';

const externalSupabase = createClient(
  'https://tpvwxfbcdqpwvdwcrluy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnd4ZmJjZHFwd3Zkd2NybHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzY4MTQsImV4cCI6MjA4NzI1MjgxNH0.z2kI-0E15hwf2GQ_rK8BTkbM_OncoY2DNRO2sjxCfFM'
);

export async function syncUserToExternal(userId: string, email: string) {
  try {
    const { error } = await externalSupabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          role: 'student',
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('External sync error:', error.message);
    } else {
      console.log('User synced to external Supabase');
    }
  } catch (err) {
    console.error('External sync failed:', err);
  }
}
