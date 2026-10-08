import { NextResponse, type NextRequest } from "next/server"
import { APP_URL, SITE_HOST, SITE_URL, isAppHost, isAppPath, isSiteHost } from "@/lib/hosts"

// Paths both hosts serve as-is: published sites, tracked registrar links and metadata files.
const SHARED = ["/site/", "/go/", "/og/", "/robots.txt", "/sitemap.xml", "/icon", "/apple-icon", "/opengraph-image", "/favicon", "/manifest"]

/**
 * Routes requests between the marketing site and the app host. Old /login links go to the app,
 * which asks for a wallet instead of an account.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = (request.headers.get("host") ?? "").toLowerCase()

  // One canonical marketing host: www and the production *.vercel.app URL redirect to it.
  if (SITE_URL && (host === `www.${SITE_HOST}` || (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")))) {
    return NextResponse.redirect(`${isAppPath(pathname) ? APP_URL : SITE_URL}${pathname}${search}`, 308)
  }

  if (pathname === "/login") return NextResponse.redirect(new URL(`/dashboard${search}`, isSiteHost(host) ? APP_URL : request.url))
  if (SHARED.some((p) => pathname.startsWith(p))) return NextResponse.next()

  if (isAppHost(host)) {
    if (pathname === "/") return NextResponse.redirect(`${APP_URL}/dashboard`)
    if (!isAppPath(pathname)) return crossHost(request, `${SITE_URL}${pathname}${search}`, 308)
  } else if (isSiteHost(host) && isAppPath(pathname)) {
    return crossHost(request, `${APP_URL}${pathname}${search}`, 307)
  }
  return NextResponse.next()
}

/**
 * Redirect to the other host. The client router's prefetch and soft-navigation fetches can't follow
 * a cross-origin redirect (CORS), and Next.js strips its RSC markers before the proxy runs, so tell
 * them apart with the browser's Sec-Fetch-Mode header. Answering a fetch with a non-RSC response
 * makes Next.js fall back to a full page load, which then gets the real redirect.
 */
function crossHost(request: NextRequest, target: string, status: 307 | 308) {
  const mode = request.headers.get("sec-fetch-mode")
  if (mode && mode !== "navigate") return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } })
  return NextResponse.redirect(target, status)
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
}
