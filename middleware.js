import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { hasSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/config";

const ONE_DAY_SECONDS = 60 * 60 * 24;

function withAdminCookieLifetime(options = {}) {
  if (options.maxAge === 0) return options;

  return {
    ...options,
    maxAge: ONE_DAY_SECONDS
  };
}

export async function middleware(request) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseConfig()) {
    return response;
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, withAdminCookieLifetime(options)));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, withAdminCookieLifetime(options)));
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
