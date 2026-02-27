import { createClient } from '@supabase/supabase-js';

const ENT_SUPABASE_URL = "https://tpvwxfbcdqpwvdwcrluy.supabase.co";
const ENT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnd4ZmJjZHFwd3Zkd2NybHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzY4MTQsImV4cCI6MjA4NzI1MjgxNH0.z2kI-0E15hwf2GQ_rK8BTkbM_OncoY2DNRO2sjxCfFM";

export const entSupabase = createClient(ENT_SUPABASE_URL, ENT_SUPABASE_ANON_KEY);
