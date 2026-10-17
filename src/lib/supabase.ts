import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://nhodgeqiatvxhcenczbz.supabase.co';
const defaultAnonKey = 'sb_publishable_nCOTIAE_nuLILIC7LI2K6A_xT-FBd79';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

// Sanitize URL if user provided full REST endpoint or trailing slashes
const cleanUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(cleanUrl) &&
    Boolean(rawAnonKey) &&
    cleanUrl !== 'https://your-supabase-url.supabase.co' &&
    rawAnonKey !== 'your-anon-key'
  );
};

export const supabase = createClient(
  cleanUrl,
  rawAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
