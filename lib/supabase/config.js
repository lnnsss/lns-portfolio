// Supabase publishable credentials are intentionally public and safe to ship to
// the browser. Keep these defaults so a missing Vercel env variable cannot lock
// the admin out; environment variables still take precedence for overrides.
const DEFAULT_SUPABASE_URL = "https://grhwypxuulycepbrzwnh.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Rl8t17TSq4sDMEh0mx165w_R5qxaCdk";

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabasePublicKey();

  if (!url || !anonKey) {
    throw new Error("Supabase env vars are missing");
  }

  return { url, anonKey };
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY
  );
}
