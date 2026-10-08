/**
 * Payment setup checker: `npm run check:payments`
 * Reads .env.local (then .env), checks every payment setting against the live services and prints what to fix.
 * Never prints secret values.
 */
import fs from "node:fs"
import { Connection, PublicKey, clusterApiUrl, type Cluster } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}
const env = (k: string) => process.env[k]?.trim() ?? ""
type Level = "PASS" | "WARN" | "FAIL"
const results: { level: Level; area: string; msg: string }[] = []
const report = (level: Level, area: string, msg: string) => {
  results.push({ level, area, msg })
  console.log(`${level.padEnd(4)}  ${area.padEnd(12)} ${msg}`)
}
const USDC: Record<string, string> = { "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" }

console.log("\nFunCoin Lab payment setup check\n")

// --- General
const secret = env("SESSION_SECRET")
if (secret.length >= 32) report("PASS", "Sessions", "SESSION_SECRET is set")
else report("FAIL", "Sessions", "SESSION_SECRET must be 32+ random characters (required for wallet sign-in)")

const site = env("NEXT_PUBLIC_SITE_URL")
let publicSite = false
if (!site) report("WARN", "Site URL", "NEXT_PUBLIC_SITE_URL is empty. Set it to your live https URL before launch.")
else if (/localhost|127\.0\.0\.1/.test(site) || !site.startsWith("https://"))
  report("WARN", "Site URL", `${site} is not a public https URL. NOWPayments can't reach the payment callback there.`)
else {
  publicSite = true
  report("PASS", "Site URL", site)
}

// --- Solana (SOL + USDC)
const cluster = (env("NEXT_PUBLIC_SOLANA_CLUSTER") || env("SOLANA_CLUSTER") || "mainnet-beta") as Cluster
const rpc = env("SOLANA_RPC_URL") || env("NEXT_PUBLIC_SOLANA_RPC_URL") || clusterApiUrl(cluster)
const merchant = env("MERCHANT_SOLANA_ADDRESS")
let walletLive = false
if (!merchant) report("FAIL", "Solana", "MERCHANT_SOLANA_ADDRESS is empty. SOL and USDC payments are OFF.")
else {
  let pk: PublicKey | null = null
  try {
    pk = new PublicKey(merchant)
    if (!PublicKey.isOnCurve(pk.toBytes())) throw new Error("off-curve")
  } catch {
    report("FAIL", "Solana", "MERCHANT_SOLANA_ADDRESS is not a normal wallet address")
  }
  if (pk) {
    report(cluster === "mainnet-beta" ? "PASS" : "WARN", "Solana", `cluster: ${cluster}${cluster !== "mainnet-beta" ? " (test network, no real money)" : ""}`)
    if (!env("SOLANA_RPC_URL") && !env("NEXT_PUBLIC_SOLANA_RPC_URL")) report("WARN", "Solana", "Using the public RPC. It rate-limits hard; use Helius, Triton or QuickNode for production.")
    try {
      const conn = new Connection(rpc, "confirmed")
      const t0 = Date.now()
      const version = await conn.getVersion()
      report("PASS", "Solana", `RPC reachable (solana-core ${version["solana-core"]}, ${Date.now() - t0} ms)`)
      const sol = await conn.getBalance(pk)
      report("PASS", "Solana", `merchant wallet ${merchant.slice(0, 4)}...${merchant.slice(-4)} (balance ${(sol / 1e9).toFixed(4)} SOL)`)
      const ata = getAssociatedTokenAddressSync(new PublicKey(USDC[cluster] ?? USDC["mainnet-beta"]), pk)
      const info = await conn.getAccountInfo(ata)
      if (info) report("PASS", "USDC", "merchant USDC token account exists")
      else report("WARN", "USDC", "no USDC token account yet. Send any small amount of USDC to the wallet once, otherwise the first USDC customer pays ~0.002 SOL to create it.")
      walletLive = true
    } catch (e) {
      report("FAIL", "Solana", `RPC error: ${e instanceof Error ? e.message.slice(0, 120) : e}`)
    }
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { signal: AbortSignal.timeout(8000) })
      const j = (await r.json()) as { solana?: { usd?: number } }
      if (j.solana?.usd) report("PASS", "SOL price", `$${j.solana.usd} (used to quote SOL payments)`)
      else throw new Error(String(r.status))
    } catch {
      report("WARN", "SOL price", "price feed unreachable. SOL checkout will fail until it's back; USDC still works.")
    }
  }
}

// --- NOWPayments (BTC, ETH, USDT and more)
const npKey = env("NOWPAYMENTS_API_KEY")
const npSecret = env("NOWPAYMENTS_IPN_SECRET")
const npBase = env("NOWPAYMENTS_API_BASE") || (env("NOWPAYMENTS_SANDBOX") === "true" ? "https://api-sandbox.nowpayments.io/v1" : "https://api.nowpayments.io/v1")
let npLive = false
if (!npKey || !npSecret) report("FAIL", "NOWPayments", `${!npKey ? "NOWPAYMENTS_API_KEY" : "NOWPAYMENTS_IPN_SECRET"} is empty. BTC / other crypto checkout is OFF.`)
else {
  try {
    const st = await fetch(`${npBase}/status`, { signal: AbortSignal.timeout(8000) })
    const sj = (await st.json()) as { message?: string }
    report(sj.message === "OK" ? "PASS" : "WARN", "NOWPayments", `API status: ${sj.message ?? st.status}${npBase.includes("sandbox") ? " (sandbox)" : ""}`)
    const res = await fetch(`${npBase}/merchant/coins`, { headers: { "x-api-key": npKey }, signal: AbortSignal.timeout(8000) })
    const j = (await res.json().catch(() => ({}))) as { selectedCurrencies?: string[]; message?: string }
    if (!res.ok) report("FAIL", "NOWPayments", `API key rejected (${res.status}${j.message ? `: ${j.message}` : ""})`)
    else {
      const coins = j.selectedCurrencies ?? []
      report(coins.length ? "PASS" : "WARN", "NOWPayments", coins.length ? `API key valid, ${coins.length} coins enabled: ${coins.slice(0, 12).join(", ")}${coins.length > 12 ? ", ..." : ""}` : "API key valid but no coins are enabled (Settings > Coins)")
      if (!coins.includes("btc")) report("WARN", "NOWPayments", "Bitcoin (btc) is not enabled on your account")
      npLive = true
    }
  } catch (e) {
    report("FAIL", "NOWPayments", `can't reach NOWPayments: ${e instanceof Error ? e.message : e}`)
  }
  if (npSecret.length < 16) report("WARN", "NOWPayments", "IPN secret looks short. Copy it exactly from Settings > Payments > IPN.")
  if (publicSite) report("PASS", "NOWPayments", `callback URL: ${site.replace(/\/$/, "")}/api/billing/nowpayments/ipn`)
  else report("WARN", "NOWPayments", "callbacks need a public https URL; payments won't be credited from localhost")
}

// --- Summary
console.log("\nCheckout methods:")
console.log(`  USDC (Solana wallet)   ${walletLive ? "ON" : "OFF"}`)
console.log(`  SOL (Solana wallet)    ${walletLive ? "ON" : "OFF"}`)
console.log(`  BTC and other crypto   ${npLive ? (publicSite ? "ON" : "ON (credits need a public URL)") : "OFF"}`)
const fails = results.filter((r) => r.level === "FAIL").length
console.log(`\n${fails ? `${fails} problem(s) to fix.` : "No blocking problems."}\n`)
process.exitCode = fails ? 1 : 0
