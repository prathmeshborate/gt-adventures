import { createClient } from '@supabase/supabase-js';

// We grab the keys from our .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// We create and export the client so we can use it anywhere in our app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);