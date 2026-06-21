import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseConfig, getSupabaseConfig } from "./config";

const ONE_DAY_SECONDS = 60 * 60 * 24;

function withAdminCookieLifetime(options = {}) {
  if (options.maxAge === 0) return options;

  return {
    ...options,
    maxAge: ONE_DAY_SECONDS
  };
}

export async function createSupabaseServerClient() {
  if (!hasSupabaseConfig()) return null;

  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, withAdminCookieLifetime(options)));
        } catch {
          // Server Components cannot write cookies; Server Actions can.
        }
      }
    }
  });
}
