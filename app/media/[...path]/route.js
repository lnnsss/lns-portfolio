import { getSupabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";

const PUBLIC_MEDIA_PATH = "/storage/v1/object/public/portfolio-media/";
const FORWARDED_REQUEST_HEADERS = ["range", "if-none-match", "if-modified-since"];
const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
];

function upstreamUrl(path) {
  const { url } = getSupabaseConfig();
  const encodedPath = path.map(encodeURIComponent).join("/");
  return `${url}${PUBLIC_MEDIA_PATH}${encodedPath}`;
}

async function proxyMedia(request, context, method) {
  const { path = [] } = await context.params;
  if (!path.length) return new Response("Media path is missing", { status: 400 });

  const requestHeaders = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl(path), {
      method,
      headers: requestHeaders,
      cache: "no-store"
    });
  } catch {
    return new Response("Media is temporarily unavailable", { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set(
    "cache-control",
    upstream.ok || upstream.status === 304
      ? "public, max-age=31536000, immutable"
      : "no-store"
  );
  responseHeaders.set("x-content-type-options", "nosniff");

  const hasBody = method !== "HEAD" && upstream.status !== 304;
  return new Response(hasBody ? upstream.body : null, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export function GET(request, context) {
  return proxyMedia(request, context, "GET");
}

export function HEAD(request, context) {
  return proxyMedia(request, context, "HEAD");
}
