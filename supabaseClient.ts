import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmgxpgirgmmqsczvsbtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ3hwZ2lyZ21tcXNjenZzYnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NDg0MDAsImV4cCI6MjA0NjMyNDQwMH0.-U5t6p6QvV1EFpO0AvkR0cXQxgIuh4bYvlXzjmGmL3A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);