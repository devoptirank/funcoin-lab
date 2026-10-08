import { NextResponse } from "next/server"
import { buildRegistrarLink } from "@/lib/domains/affiliate"
import { isValidFunDomain } from "@/lib/generator/domains"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { getSession } from "@/lib/auth/session"
import { logDomainClick } from "@/lib/data/server"

const SOURCES = new Set(["finder", "results", "dashboard", "other"])

/**
 * Tracked outbound link to the registrar: /go/domain?d=sleepycat.fun&src=finder
 * Logs the click (domain + source + signed-in wallet account, nothing else), then redirects. The target is
 * always built from our own template, so this can't be used as an open redirect.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const domain = (url.searchParams.get("d") ?? "").trim().toLowerCase()
  const source = SOURCES.has(url.searchParams.get("src") ?? "") ? url.searchParams.get("src")! : "other"
  if (!isValidFunDomain(domain)) return NextResponse.redirect(new URL("/domains", url.origin))

  if (rateLimit(clientKey(req, "domain-click"), 60, 60_000).ok) {
    try {
      await logDomainClick(domain, source, (await getSession())?.accountId ?? null)
    } catch (error) {
      console.error("[domain-click] log failed:", error instanceof Error ? error.message : error)
    }
  }

  const res = NextResponse.redirect(buildRegistrarLink(domain), 302)
  res.headers.set("X-Robots-Tag", "noindex, nofollow")
  res.headers.set("Referrer-Policy", "no-referrer-when-downgrade")
  return res
}
