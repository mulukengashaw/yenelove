import { createClient } from '@supabase/supabase-js';

// Your specific Supabase Project URL
const supabaseUrl = 'https://gmgxpgirgmmqsczvsbtv.supabase.co';

// Accessing the key safely for Vite
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_ANON_KEY. Please add it to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');
