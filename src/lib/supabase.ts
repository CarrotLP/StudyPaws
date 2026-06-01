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
 * Expo Router renders routes on the server during dev (SSR) where there's no
 * `window` and no React Native native modules. AsyncStorage's methods crash
 * there, which is what was making supabase-js's `_emitInitialSession` blow up
 * during page load. Detect that environment and swap in a no-op shim; the real
 * AsyncStorage is only used on the device/simulator.
 *
 * We also turn off `autoRefreshToken` and `persistSession` on the server: both
 * trigger the very storage-read path that crashes, and neither is meaningful
 * during SSR anyway.
 */
const isServer = typeof window === 'undefined';

const SSRSafeStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

/**
 * Typed Supabase client.
 *
 * Currently typed with the default (`any`-tables) generic — pass a generated
 * `Database` type here once the schema lands (e.g. `createClient<Database>(...)`),
 * which gives end-to-end typing on `.from(...)` queries.
 *
 * `detectSessionInUrl` is off because that flow only applies to web/OAuth-
 * redirect contexts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? SSRSafeStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
