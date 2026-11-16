import { createClient } from '@supabase/supabase-js';

// The tracker shares the ESOL HR Suite Supabase project but only uses the work_tracker schema.
// It does not use Supabase Auth: the session is an opaque token from work_tracker.sign_in, sent on every
// request as the x-tracker-session header, which the schema's RLS policies check.
// Requests go through /supabase on our own domain (vercel.json / vite proxy) so networks that can't reach
// *.supabase.co still work; set VITE_SUPABASE_DIRECT=true to call the project directly.
const url =
  import.meta.env.VITE_SUPABASE_DIRECT === 'true'
    ? import.meta.env.VITE_SUPABASE_URL
    : `${window.location.origin}/supabase`;

const SESSION_KEY = 'esol-work-tracker.session';

function readToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

let token: string | null = readToken();

export const getSessionToken = () => token;

export function setSessionToken(next: string | null) {
  token = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, next);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // storage blocked (private mode): the session just won't survive a reload
  }
}

const trackerFetch: typeof fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);
  if (token) headers.set('x-tracker-session', token);
  return fetch(input, { ...init, headers });
};

export const db = createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  db: { schema: 'work_tracker' },
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'esol-work-tracker.auth' },
  global: { fetch: trackerFetch },
});

/** Unwraps a Supabase response, throwing its error so callers can use try/catch. */
export async function unwrap<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as T;
}
