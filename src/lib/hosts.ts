/**
 * Two hosts, one deployment:
 * - the marketing site (NEXT_PUBLIC_SITE_URL, e.g. https://funcoinlab.com)
 * - the app (NEXT_PUBLIC_APP_URL, e.g. https://app.funcoinlab.com): dashboard, tools, editor.
 *
 * The split only applies on those two hosts. Any other host (localhost, *.vercel.app previews)
 * serves everything, so development and previews keep working without DNS.
 */

const hostOf = (url: string | undefined) => {
  try {
    return url ? new URL(url).host.toLowerCase() : ""
  } catch {
    return ""
  }
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
export const SITE_HOST = hostOf(SITE_URL)
export const APP_HOST = hostOf(APP_URL)
export const SPLIT_HOSTS = Boolean(SITE_HOST && APP_HOST && SITE_HOST !== APP_HOST)

/** Path prefixes that belong to the app (wallet required). */
export const APP_PATHS = ["/dashboard", "/create", "/domains", "/logo", "/memes", "/social", "/content", "/editor", "/preview"]

export const isAppPath = (pathname: string) => APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

const bare = (host: string) => host.replace(/^www\./, "")
export const isSiteHost = (host: string) => SPLIT_HOSTS && bare(host.toLowerCase()) === bare(SITE_HOST)
export const isAppHost = (host: string) => SPLIT_HOSTS && host.toLowerCase() === APP_HOST

/** Where the app's dashboard lives, as seen from `currentHost`. Relative when we're already on the right host. */
export function appHref(path = "/dashboard", currentHost?: string) {
  if (!SPLIT_HOSTS || (currentHost && !isSiteHost(currentHost))) return path
  return `${APP_URL}${path}`
}

/**
 * Cookie domain shared by both hosts (".funcoinlab.com" style, written without the dot), or
 * undefined for a host-only cookie. Only returned when the request host is inside that domain,
 * otherwise browsers would reject the cookie (for example on a *.vercel.app preview).
 */
export function sharedCookieDomain(requestHost: string | null | undefined): string | undefined {
  if (!SPLIT_HOSTS) return undefined
  const root = bare(SITE_HOST).split(":")[0]
  if (!APP_HOST.split(":")[0].endsWith(`.${root}`)) return undefined
  const h = (requestHost ?? "").toLowerCase().split(":")[0]
  return h === root || h.endsWith(`.${root}`) ? root : undefined
}

/** The host the browser actually used (behind Vercel's proxy too), for sign-in message domains. */
export function requestHost(req: Request): string {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host).split(",")[0].trim().toLowerCase()
}

/**
 * Absolute app URL for app paths when the hosts are split, otherwise unchanged. Next.js treats it as
 * an external link on the marketing host (full page load, no cross-origin prefetch) and as a normal
 * client-side link on the app host itself.
 */
export function toAppUrl(href: string): string {
  if (!SPLIT_HOSTS || !href.startsWith("/")) return href
  const path = href.split(/[?#]/)[0]
  return isAppPath(path) ? `${APP_URL}${href}` : href
}
