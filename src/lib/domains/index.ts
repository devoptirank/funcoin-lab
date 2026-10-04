import "server-only"
import type { DomainCheckResult, DomainStatus } from "@/lib/types"

/**
 * Domain availability architecture.
 *
 *   DOMAIN_PROVIDER=none   (default) — no lookups; every result is "unknown". We never claim availability.
 *   DOMAIN_PROVIDER=rdap   — public RDAP registry lookup. Reports "registered" or "no-record" (not "available":
 *                            premium/reserved names can have no record and still be unavailable).
 *   DOMAIN_PROVIDER=dynadot — Dynadot api3 "search" (DYNADOT_API_KEY). Reports "available" with price or
 *                            "registered". Results are cached for 10 minutes.
 *   DOMAIN_PROVIDER=http   — your registrar/reseller API. DOMAIN_API_URL receives POST {domains: string[]}
 *                            with header Authorization: Bearer DOMAIN_API_KEY and must return
 *                            {results: [{domain: string, available: boolean}]}. Only this mode can say "available".
 *
 * To add a registrar SDK, implement DomainProvider and register it in `providers`.
 */
export interface DomainProvider {
  readonly id: string
  check(domains: string[]): Promise<DomainCheckResult[]>
}

const now = () => new Date().toISOString()

const noneProvider: DomainProvider = {
  id: "none",
  async check(domains) {
    return domains.map((domain) => ({
      domain,
      status: "unknown" as DomainStatus,
      provider: "none",
      message: "No registrar connected, so availability wasn't checked. Confirm with a registrar before buying.",
      checkedAt: now(),
    }))
  },
}

const rdapProvider: DomainProvider = {
  id: "rdap",
  async check(domains) {
    const base = process.env.DOMAIN_RDAP_URL || "https://rdap.org/domain/"
    return Promise.all(
      domains.map(async (domain): Promise<DomainCheckResult> => {
        try {
          const res = await fetch(`${base}${encodeURIComponent(domain)}`, {
            headers: { Accept: "application/rdap+json" },
            signal: AbortSignal.timeout(8000),
            redirect: "follow",
            cache: "no-store",
          })
          if (res.status === 200)
            return { domain, status: "registered", provider: "rdap", message: "Registered (registry record found).", checkedAt: now() }
          if (res.status === 404)
            return {
              domain,
              status: "no-record",
              provider: "rdap",
              message: "No registry record found. It may be registrable, but premium or reserved names can still be unavailable. Confirm with a registrar.",
              checkedAt: now(),
            }
          return { domain, status: "unknown", provider: "rdap", message: `Registry returned ${res.status}.`, checkedAt: now() }
        } catch {
          return { domain, status: "error", provider: "rdap", message: "Lookup failed. Try again later.", checkedAt: now() }
        }
      }),
    )
  },
}

const httpProvider: DomainProvider = {
  id: "http",
  async check(domains) {
    const url = process.env.DOMAIN_API_URL
    if (!url) return noneProvider.check(domains)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.DOMAIN_API_KEY ? { Authorization: `Bearer ${process.env.DOMAIN_API_KEY}` } : {}),
        },
        body: JSON.stringify({ domains }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      })
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { results?: { domain: string; available: boolean }[] }
      const byDomain = new Map(json.results?.map((r) => [r.domain.toLowerCase(), r.available]))
      return domains.map((domain) => {
        const available = byDomain.get(domain)
        return {
          domain,
          status: available === undefined ? "unknown" : available ? "available" : "registered",
          provider: "http",
          message: available ? "Reported available by your registrar. Prices may vary." : undefined,
          checkedAt: now(),
        }
      })
    } catch {
      return domains.map((domain) => ({ domain, status: "error" as DomainStatus, provider: "http", message: "Registrar API error.", checkedAt: now() }))
    }
  },
}

// ---------------- Dynadot (api3.json "search") ----------------

type DynadotSearch = {
  SearchResponse?: {
    ResponseCode?: string
    Error?: string
    SearchResults?: { DomainName?: string; Available?: string; Price?: string; Status?: string }[]
  }
}

const CACHE_MS = 10 * 60 * 1000
const dynadotCache = new Map<string, { result: DomainCheckResult; expires: number }>()

const dynadotProvider: DomainProvider = {
  id: "dynadot",
  async check(domains) {
    const key = process.env.DYNADOT_API_KEY?.trim()
    if (!key) return noneProvider.check(domains)

    const fresh: DomainCheckResult[] = []
    const todo: string[] = []
    for (const d of domains) {
      const hit = dynadotCache.get(d)
      if (hit && hit.expires > Date.now()) fresh.push(hit.result)
      else todo.push(d)
    }
    if (!todo.length) return domains.map((d) => fresh.find((r) => r.domain === d)!)

    const base =
      process.env.DYNADOT_API_BASE?.trim() ||
      (process.env.DYNADOT_SANDBOX === "true" ? "https://api-sandbox.dynadot.com" : "https://api.dynadot.com")
    const params = new URLSearchParams({ key, command: "search", show_price: "1", currency: "USD" })
    todo.forEach((d, i) => params.set(`domain${i}`, d))

    let looked: DomainCheckResult[]
    try {
      const res = await fetch(`${base}/api3.json?${params.toString()}`, { signal: AbortSignal.timeout(10_000), cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as DynadotSearch
      const sr = json.SearchResponse
      if (!sr || sr.ResponseCode !== "0") throw new Error(sr?.Error || "Unexpected Dynadot response")
      const byName = new Map(sr.SearchResults?.map((r) => [r.DomainName?.toLowerCase() ?? "", r]))
      looked = todo.map((domain) => {
        const r = byName.get(domain)
        const available = r?.Available?.toLowerCase()
        // "77.00 in USD" -> "77.00 USD"
        const price = r?.Price ? r.Price.replace(/\s+in\s+/i, " ").trim() : undefined
        const result: DomainCheckResult =
          available === "yes"
            ? { domain, status: "available", provider: "dynadot", price, message: price ? `Available at Dynadot for ${price} (first year). Prices can change.` : "Available at Dynadot.", checkedAt: now() }
            : available === "no"
              ? { domain, status: "registered", provider: "dynadot", message: "Already registered.", checkedAt: now() }
              : { domain, status: "unknown", provider: "dynadot", message: "Dynadot didn't return a result for this name.", checkedAt: now() }
        if (result.status !== "unknown") dynadotCache.set(domain, { result, expires: Date.now() + CACHE_MS })
        return result
      })
    } catch (error) {
      console.error("[domains] dynadot lookup failed:", error instanceof Error ? error.message : error)
      looked = todo.map((domain) => ({ domain, status: "error" as DomainStatus, provider: "dynadot", message: "Registrar lookup failed. Try again in a moment.", checkedAt: now() }))
    }
    const all = [...fresh, ...looked]
    return domains.map((d) => all.find((r) => r.domain === d)!)
  },
}

const providers: Record<string, DomainProvider> = { none: noneProvider, rdap: rdapProvider, http: httpProvider, dynadot: dynadotProvider }

export function getDomainProvider(): DomainProvider {
  return providers[process.env.DOMAIN_PROVIDER?.trim().toLowerCase() || "none"] ?? noneProvider
}
