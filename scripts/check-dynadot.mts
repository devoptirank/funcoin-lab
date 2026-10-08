/**
 * Checks the Dynadot connection with a real search: npm run check:domains
 * Reads DYNADOT_API_KEY from .env.local. Never prints the key.
 */
import { readFileSync } from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const key = process.env.DYNADOT_API_KEY?.trim()
const provider = process.env.DOMAIN_PROVIDER?.trim() || "none"
console.log(`DOMAIN_PROVIDER = ${provider}${provider === "dynadot" ? "" : "  (set it to dynadot to turn the integration on)"}`)
if (!key) {
  console.log("FAIL  DYNADOT_API_KEY is empty. Get it from Dynadot: Account > Tools > API.")
  process.exit(1)
}
const base = process.env.DYNADOT_SANDBOX === "true" ? "https://api-sandbox.dynadot.com" : "https://api.dynadot.com"
const names = ["funcoinlab.com", `funcoinlab-test-${Date.now().toString(36)}.fun`]
const params = new URLSearchParams({ key, command: "search", show_price: "1", currency: "USD" })
names.forEach((d, i) => params.set(`domain${i}`, d))
const res = await fetch(`${base}/api3.json?${params}`, { signal: AbortSignal.timeout(15_000) })
const json = (await res.json().catch(() => ({}))) as {
  SearchResponse?: { ResponseCode?: string; Error?: string; SearchResults?: { DomainName?: string; Available?: string; Price?: string }[] }
  Response?: { ResponseCode?: string; Error?: string }
}
const sr = json.SearchResponse
if (!res.ok || !sr || sr.ResponseCode !== "0") {
  const error = sr?.Error ?? json.Response?.Error ?? `HTTP ${res.status}`
  console.log(`FAIL  Dynadot said: ${error}`)
  if (/ip address/i.test(error)) console.log("      Add that IP in Dynadot: Account > Tools > API > IP whitelist. Vercel has no fixed IP, see README (Domain checks).")
  process.exit(1)
}
console.log("PASS  API key works")
for (const r of sr.SearchResults ?? []) console.log(`      ${r.DomainName}: ${r.Available === "yes" ? `available${r.Price ? `, ${r.Price}` : ""}` : "registered"}`)
const aff = process.env.NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE?.trim()
console.log(aff ? (aff.includes("{domain}") ? "PASS  affiliate link template set" : "FAIL  affiliate template has no {domain} placeholder") : "WARN  no affiliate template: buy links use the plain Dynadot search")
