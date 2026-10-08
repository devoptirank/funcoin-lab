import { NextResponse, type NextRequest } from "next/server"
import { APP_URL, SITE_URL, isAppHost, isAppPath, isSiteHost } from "@/lib/hosts"

// Paths both hosts serve as-is: published sites, tracked registrar links and metadata files.
const SHARED = ["/site/", "/go/", "/robots.txt", "/sitemap.xml", "/icon", "/apple-icon", "/opengraph-image", "/favicon"]

/**
 * Routes requests between the marketing site and the app host. Old /login links go to the app,
 * which asks for a wallet instead of an account.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get("host") ?? ""

  if (pathname === "/login") return NextResponse.redirect(new URL(`/dashboard${search}`, isSiteHost(host) ? APP_URL : request.url))
  if (SHARED.some((p) => pathname.startsWith(p))) return NextResponse.next()

  if (isAppHost(host)) {
    if (pathname === "/") return NextResponse.redirect(`${APP_URL}/dashboard`)
    if (!isAppPath(pathname)) return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 308)
  } else if (isSiteHost(host) && isAppPath(pathname)) {
    return NextResponse.redirect(`${APP_URL}${pathname}${search}`, 307)
  }
  return NextResponse.next()
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
}
