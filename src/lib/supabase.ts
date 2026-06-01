// React Native polyfills required by supabase-js (must come before importing it).
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase URL and anon key are read from EXPO_PUBLIC_* env vars so they're
 * inlined into the JS bundle at build time. They are never hardcoded here.
 * (The anon key is intentionally public — it's gated by RLS server-side. Don't
 * ever put the *service-role* key in an EXPO_PUBLIC_* var.)
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the values from Supabase Dashboard → Project Settings → API.',
  );
}

/**
 * Typed Supabase client.
 *
 * Currently typed with the default (`any`-tables) generic — pass a generated
 * `Database` type here once the schema lands (e.g. `createClient<Database>(...)`),
 * which gives end-to-end typing on `.from(...)` queries.
 *
 * AsyncStorage is wired in as the session store so the auth token persists
 * across app restarts on iOS/Android. `detectSessionInUrl` is off because that
 * flow only applies to web/OAuth-redirect contexts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
