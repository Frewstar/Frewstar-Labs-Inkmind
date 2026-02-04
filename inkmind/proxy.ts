import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * 1) Supabase Auth: refresh session and keep cookies in sync.
 * 2) Multi-tenant routing: subdomains (e.g. blacksector.localhost:3000 or
 *    studio.inkmind.com) are rewritten to /studios/[subdomain]/* so tenant-specific
 *    content can be served. The main landing page is unchanged when no subdomain.
 */

const MAIN_HOSTS = ["localhost", "127.0.0.1", "www"];
const MAIN_DOMAIN_SUFFIXES = ["inkmind.com", "localhost"];

function getSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  const first = parts[0];
  const rest = parts.slice(1).join(".");
  if (first.toLowerCase() === "www") return null;
  const isKnownMain =
    rest === "localhost" ||
    rest === "127.0.0.1" ||
    MAIN_DOMAIN_SUFFIXES.some((s) => rest === s || rest.endsWith("." + s));
  if (isKnownMain && first) return first;
  if (MAIN_HOSTS.includes(hostname)) return null;
  return null;
}

export async function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = hostHeader.split(":")[0];
  const subdomain = getSubdomain(hostname);

  let response: NextResponse;
  if (subdomain) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const url = request.nextUrl.clone();
    url.pathname = `/studios/${subdomain}${pathname}`;
    url.search = search;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  return await updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?)$).*)",
  ],
};
