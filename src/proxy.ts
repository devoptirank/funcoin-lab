import { NextResponse, type NextRequest } from "next/server"
import { APP_URL, SITE_HOST, SITE_URL, isAdminHost, isAppHost, isAppPath, isSiteHost } from "@/lib/hosts"

// Paths both hosts serve as-is: published sites, tracked registrar links and metadata files.
const SHARED = ["/site/", "/go/", "/og/", "/robots.txt", "/sitemap.xml", "/icon", "/apple-icon", "/opengraph-image", "/favicon", "/manifest"]

// APIs the admin host may serve: its own, wallet sign-in, and the Solana RPC relay the wallet needs.
const ADMIN_HOST_APIS = /^\/api\/(admin|auth)\/|^\/api\/solana\/rpc$/

const isAdminPath = (p: string) => p === "/admin" || p.startsWith("/admin/") || p === "/api/admin" || p.startsWith("/api/admin/")

/** Security headers for every admin page and API response. */
function adminHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow")
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("Referrer-Policy", "no-referrer")
  res.headers.set("Cache-Control", "no-store")
  return res
}

/**
 * An ordinary 404, identical to any missing page. Used to hide the admin panel on public hosts
 * (never a redirect, which would reveal the admin address).
 */
const hidden = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/api/")
    ? new NextResponse("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
    : NextResponse.rewrite(new URL("/hidden-404", request.url))

/**
 * Routes requests between the marketing site, the app host and the admin host. Old /login links go
 * to the app, which asks for a wallet instead of an account.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = (request.headers.get("host") ?? "").toLowerCase()

  // Admin host: clean URLs (/users -> /admin/users), its own APIs only, everything else is a 404.
  if (isAdminHost(host)) {
    if (pathname.startsWith("/api/")) return adminHeaders(ADMIN_HOST_APIS.test(pathname) ? NextResponse.next() : hidden(request))
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminHeaders(hidden(request))
    if (SHARED.some((p) => pathname.startsWith(p))) return adminHeaders(hidden(request))
    return adminHeaders(NextResponse.rewrite(new URL(`/admin${pathname === "/" ? "" : pathname}${search}`, request.url)))
  }
  // Public hosts: the admin panel doesn't exist here.
  if ((isSiteHost(host) || isAppHost(host)) && isAdminPath(pathname)) return hidden(request)
  // Localhost and preview deployments serve /admin directly, with the same headers.
  if (isAdminPath(pathname)) return adminHeaders(NextResponse.next())

  if (pathname.startsWith("/api/")) return NextResponse.next()

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
  // Pages and API routes; skip Next internals and files with an extension.
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
}
