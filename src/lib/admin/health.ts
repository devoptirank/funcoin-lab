import "server-only"
import { PublicKey } from "@solana/web3.js"
import { aiStatus } from "@/lib/ai"
import { getDomainProvider } from "@/lib/domains"
import { solanaConfig } from "@/lib/billing/solana"
import { nowPaymentsEnabled } from "@/lib/billing/nowpayments"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * Integration checks and the env checklist for the admin System page (and the "integrations down"
 * row on the Overview). Results only ever contain names, states, latencies and short messages. No
 * env value, key or private URL is returned.
 */

export type CheckStatus = "ok" | "warn" | "down" | "off"
export type HealthCheck = { id: string; label: string; status: CheckStatus; detail: string; latencyMs?: number }

const started = new Date().toISOString()

class Timeout extends Error {}

async function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([Promise.resolve(p), new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Timeout(`No answer in ${ms} ms`)), ms)))])
  } finally {
    clearTimeout(timer)
  }
}

/** A short, safe error message (never a URL, which could carry an API key). */
function why(e: unknown): string {
  if (e instanceof Timeout) return e.message
  const msg = e instanceof Error ? e.message : String(e)
  return msg.replace(/https?:\/\/\S+/g, "[url]").slice(0, 140)
}

async function timed<T>(fn: () => PromiseLike<T>, ms: number): Promise<{ value: T; latencyMs: number }> {
  const t0 = Date.now()
  const value = await withTimeout(fn(), ms)
  return { value, latencyMs: Date.now() - t0 }
}

async function checkSupabase(ms: number): Promise<HealthCheck> {
  const base = { id: "supabase", label: "Supabase database" }
  const sb = getSupabaseAdmin()
  if (!sb) return { ...base, status: "down", detail: "Not connected (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)" }
  try {
    const { value, latencyMs } = await timed(() => sb.from("billing_accounts").select("id", { head: true, count: "estimated" }).limit(1).abortSignal(AbortSignal.timeout(ms)), ms)
    if (value.error) return { ...base, status: "down", detail: why(value.error.message), latencyMs }
    return { ...base, status: "ok", detail: `Query ok, about ${value.count ?? 0} accounts`, latencyMs }
  } catch (e) {
    return { ...base, status: "down", detail: why(e) }
  }
}

async function checkSolana(ms: number): Promise<HealthCheck> {
  const { cluster, rpc } = solanaConfig()
  const custom = Boolean(process.env.SOLANA_RPC_URL?.trim() || process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim())
  const base = { id: "solana", label: "Solana RPC" }
  try {
    const { value, latencyMs } = await timed(
      () =>
        fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [{ commitment: "confirmed" }] }),
          signal: AbortSignal.timeout(ms),
          cache: "no-store",
        }).then(async (r) => ({ ok: r.ok, status: r.status, json: (await r.json().catch(() => ({}))) as { result?: number; error?: { message?: string } } })),
      ms,
    )
    const where = `${cluster}, ${custom ? "dedicated RPC" : "public RPC"}`
    if (!value.ok || typeof value.json.result !== "number") return { ...base, status: "down", detail: `${where}: ${value.json.error?.message ? why(value.json.error.message) : `HTTP ${value.status}`}`, latencyMs }
    const slow = latencyMs > 1500
    return { ...base, status: custom && !slow ? "ok" : "warn", detail: `${where}, slot ${value.json.result.toLocaleString("en-US")}${custom ? "" : " (rate-limited, use a dedicated RPC)"}${slow ? ", slow" : ""}`, latencyMs }
  } catch (e) {
    return { ...base, status: "down", detail: `${cluster}: ${why(e)}` }
  }
}

function nowPaymentsBase() {
  return process.env.NOWPAYMENTS_API_BASE?.trim() || (process.env.NOWPAYMENTS_SANDBOX === "true" ? "https://api-sandbox.nowpayments.io/v1" : "https://api.nowpayments.io/v1")
}

async function checkNowPayments(ms: number, deep: boolean): Promise<HealthCheck> {
  const base = { id: "nowpayments", label: "NOWPayments" }
  if (!nowPaymentsEnabled()) return { ...base, status: "off", detail: "Not configured (API key or IPN secret missing). Checkout with BTC, ETH and other coins is off." }
  const api = nowPaymentsBase()
  const mode = api.includes("sandbox") ? "sandbox" : "live"
  try {
    const { value, latencyMs } = await timed(
      () => fetch(`${api}/status`, { signal: AbortSignal.timeout(ms), cache: "no-store" }).then(async (r) => ({ status: r.status, json: (await r.json().catch(() => ({}))) as { message?: string } })),
      ms,
    )
    if (value.json.message !== "OK") return { ...base, status: "down", detail: `${mode}: API status ${value.json.message ? why(value.json.message) : `HTTP ${value.status}`}`, latencyMs }
    if (deep) {
      const key = await withTimeout(
        fetch(`${api}/merchant/coins`, { headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!.trim() }, signal: AbortSignal.timeout(ms), cache: "no-store" }).then((r) => r.status),
        ms,
      ).catch(() => 0)
      if (key === 401 || key === 403) return { ...base, status: "down", detail: `${mode}: API reachable but the API key was rejected`, latencyMs }
      if (key !== 200) return { ...base, status: "warn", detail: `${mode}: API reachable, key check inconclusive`, latencyMs }
      return { ...base, status: mode === "sandbox" ? "warn" : "ok", detail: `${mode}: API reachable, API key accepted`, latencyMs }
    }
    return { ...base, status: mode === "sandbox" ? "warn" : "ok", detail: `${mode}: API reachable`, latencyMs }
  } catch (e) {
    return { ...base, status: "down", detail: `${mode}: ${why(e)}` }
  }
}

function checkAi(): HealthCheck[] {
  const s = aiStatus()
  return [
    {
      id: "ai-text",
      label: "AI text",
      status: s.provider === "local" ? "warn" : "ok",
      detail: s.provider === "local" ? "Built-in templates (no AI_API_KEY or AI_PROVIDER=local)" : `${s.provider}, model ${s.model}`,
    },
    {
      id: "ai-images",
      label: "AI images",
      status: s.images ? "ok" : "off",
      detail: s.images ? `${process.env.IMAGE_PROVIDER?.trim().toLowerCase()}, model ${process.env.IMAGE_MODEL?.trim() || "default"}` : "Not configured (IMAGE_PROVIDER=none or no image key)",
    },
  ]
}

function checkDomains(): HealthCheck {
  const id = getDomainProvider().id
  const base = { id: "domains", label: "Domain provider" }
  if (id === "none") return { ...base, status: "off", detail: "none (availability is never claimed)" }
  if (id === "dynadot" && !process.env.DYNADOT_API_KEY?.trim()) return { ...base, status: "down", detail: "dynadot selected but DYNADOT_API_KEY is missing" }
  if (id === "http" && !process.env.DOMAIN_API_URL?.trim()) return { ...base, status: "down", detail: "http selected but DOMAIN_API_URL is missing" }
  const sandbox = id === "dynadot" && process.env.DYNADOT_SANDBOX === "true"
  return { ...base, status: sandbox ? "warn" : "ok", detail: `${id}${sandbox ? " (sandbox)" : ""}` }
}

async function checkStorage(ms: number): Promise<HealthCheck> {
  const base = { id: "storage", label: "Storage bucket \"generated\"" }
  const sb = getSupabaseAdmin()
  if (!sb) return { ...base, status: "down", detail: "Supabase not connected" }
  try {
    const { value, latencyMs } = await timed(() => sb.storage.from("generated").list("", { limit: 1 }), ms)
    if (value.error) return { ...base, status: "down", detail: why(value.error.message), latencyMs }
    return { ...base, status: "ok", detail: "Listing works", latencyMs }
  } catch (e) {
    return { ...base, status: "down", detail: why(e) }
  }
}

/**
 * Run every integration check in parallel. `deep` adds checks that cost an extra request (the
 * NOWPayments key check); the Overview uses short timeouts and no deep checks.
 */
export async function runHealthChecks(opts: { timeoutMs?: number; deep?: boolean } = {}): Promise<HealthCheck[]> {
  const ms = opts.timeoutMs ?? 5000
  const [supabase, solana, nowpayments, storage] = await Promise.all([checkSupabase(ms), checkSolana(ms), checkNowPayments(ms, Boolean(opts.deep)), checkStorage(ms)])
  return [supabase, storage, solana, nowpayments, ...checkAi(), checkDomains()]
}

// ---------- Env checklist ----------

export type EnvState = "set" | "missing" | "invalid" | "optional"
export type EnvRow = { name: string; group: string; state: EnvState; note?: string }

type Rule = { name: string; required?: boolean | (() => boolean); check?: (v: string) => string | null; note?: string }

const isProd = () => process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"

function base58Address(v: string, onCurve = false): string | null {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return "Not a valid base58 Solana address"
  try {
    const pk = new PublicKey(v)
    if (onCurve && !PublicKey.isOnCurve(pk.toBytes())) return "Not a normal wallet address (off-curve)"
  } catch {
    return "Not a valid Solana address"
  }
  return null
}

function url(v: string, httpsInProd = true): string | null {
  let u: URL
  try {
    u = new URL(v)
  } catch {
    return "Not a valid URL"
  }
  if (httpsInProd && isProd() && u.protocol !== "https:") return "Must be https in production"
  return null
}

const minLen = (n: number) => (v: string) => (v.length >= n ? null : `Must be at least ${n} characters`)
const oneOf = (...opts: string[]) => (v: string) => (opts.includes(v.toLowerCase()) ? null : `Must be one of: ${opts.join(", ")}`)
const bool = oneOf("true", "false")
const template = (v: string) => url(v.replace("{domain}", "example.com")) ?? (v.includes("{domain}") ? null : "Missing the {domain} placeholder")
const positiveInt = (v: string) => (/^\d+$/.test(v) ? null : "Must be a whole number")

const emailAddress = (v: string) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "Not an email address")

/** Mirrors .env.example. Keep both in sync when adding a variable. */
const ENV_GROUPS: { group: string; rules: Rule[] }[] = [
  {
    group: "Site",
    rules: [
      { name: "NEXT_PUBLIC_SITE_URL", required: isProd, check: (v) => url(v) },
      { name: "NEXT_PUBLIC_APP_URL", required: isProd, check: (v) => url(v) },
      { name: "NEXT_PUBLIC_CONTACT_EMAIL", check: (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "Not an email address") },
    ],
  },
  {
    group: "AI",
    rules: [
      { name: "AI_PROVIDER", check: oneOf("anthropic", "openai", "local") },
      { name: "AI_API_KEY", note: "Without it, the built-in templates are used" },
      { name: "AI_MODEL" },
      { name: "AI_BASE_URL", check: (v) => url(v) },
      { name: "IMAGE_PROVIDER", check: oneOf("openai", "none") },
      { name: "OPENAI_API_KEY" },
      { name: "IMAGE_API_KEY" },
      { name: "IMAGE_MODEL" },
      { name: "IMAGE_QUALITY", check: oneOf("low", "medium", "high", "auto") },
      { name: "IMAGE_GLOBAL_DAILY_LIMIT", check: positiveInt, note: "Default for the global daily image limit setting" },
    ],
  },
  {
    group: "Wallet sign-in and credits",
    rules: [
      { name: "SESSION_SECRET", required: true, check: minLen(32) },
      { name: "NEXT_PUBLIC_SOLANA_CLUSTER", check: oneOf("mainnet-beta", "devnet") },
      { name: "NEXT_PUBLIC_SOLANA_RPC_URL", check: (v) => url(v), note: "Optional, the browser uses /api/solana/rpc" },
      { name: "SOLANA_RPC_URL", check: (v) => url(v), note: "Dedicated RPC strongly recommended" },
      { name: "MERCHANT_SOLANA_ADDRESS", check: (v) => base58Address(v, true), note: "Empty turns SOL and USDC checkout off" },
      { name: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" },
      { name: "NOWPAYMENTS_API_KEY" },
      { name: "NOWPAYMENTS_IPN_SECRET", required: () => Boolean(process.env.NOWPAYMENTS_API_KEY?.trim()), check: minLen(16) },
      { name: "NOWPAYMENTS_SANDBOX", check: bool },
    ],
  },
  {
    group: "Supabase",
    rules: [
      { name: "SUPABASE_URL", required: true, check: (v) => url(v) },
      { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, check: minLen(20) },
    ],
  },
  {
    group: "Domains",
    rules: [
      { name: "DOMAIN_PROVIDER", check: oneOf("none", "dynadot", "rdap", "http") },
      { name: "DYNADOT_API_KEY", required: () => process.env.DOMAIN_PROVIDER?.trim().toLowerCase() === "dynadot" },
      { name: "DYNADOT_SANDBOX", check: bool },
      { name: "DOMAIN_API_URL", required: () => process.env.DOMAIN_PROVIDER?.trim().toLowerCase() === "http", check: (v) => url(v) },
      { name: "DOMAIN_API_KEY" },
      { name: "NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE", check: template },
      { name: "NEXT_PUBLIC_REGISTRAR_SEARCH_URL", check: template },
      { name: "NEXT_PUBLIC_REGISTRAR_NAME" },
    ],
  },
  {
    group: "Default community links",
    rules: ["NEXT_PUBLIC_DEFAULT_X_URL", "NEXT_PUBLIC_DEFAULT_TELEGRAM_URL", "NEXT_PUBLIC_DEFAULT_DISCORD_URL"].map((name) => ({ name, check: (v: string) => url(v) })),
  },
  {
    group: "Official channels and token",
    rules: [
      ...["NEXT_PUBLIC_X_URL", "NEXT_PUBLIC_TELEGRAM_URL", "NEXT_PUBLIC_DISCORD_URL", "NEXT_PUBLIC_GITHUB_URL", "NEXT_PUBLIC_INSTAGRAM_URL", "NEXT_PUBLIC_TIKTOK_URL", "NEXT_PUBLIC_YOUTUBE_URL"].map((name) => ({
        name,
        check: (v: string) => url(v),
      })),
      { name: "NEXT_PUBLIC_TOKEN_NAME" },
      { name: "NEXT_PUBLIC_TOKEN_TICKER" },
      { name: "NEXT_PUBLIC_TOKEN_CA", check: (v) => base58Address(v), note: "Changing it requires a redeploy" },
      ...["NEXT_PUBLIC_PUMPFUN_URL", "NEXT_PUBLIC_DEX_URL", "NEXT_PUBLIC_JUPITER_URL", "NEXT_PUBLIC_COINGECKO_URL", "NEXT_PUBLIC_CMC_URL"].map((name) => ({ name, check: (v: string) => url(v) })),
    ],
  },
  {
    // Owner and lawyer decisions. Blank is allowed: the legal pages leave the matching sentence out.
    group: "Legal details",
    rules: [
      { name: "NEXT_PUBLIC_GA_ID", check: (v) => (/^G-[A-Z0-9]{4,}$/.test(v) ? null : "Should look like G-XXXXXXXX"), note: "Optional. Blank = no analytics and no cookie banner" },
      { name: "NEXT_PUBLIC_LEGAL_ENTITY", note: "Who operates the site. Shown in the Terms and Privacy Policy" },
      { name: "NEXT_PUBLIC_LEGAL_ADDRESS", note: "Operator's address" },
      { name: "NEXT_PUBLIC_LEGAL_COUNTRY", note: "Operator's country" },
      { name: "NEXT_PUBLIC_GOVERNING_LAW", note: "Adds the governing law section to the Terms" },
      { name: "NEXT_PUBLIC_DISPUTE_VENUE", note: "Courts or forum for disputes" },
      { name: "NEXT_PUBLIC_PRIVACY_EMAIL", check: emailAddress, note: "Privacy requests" },
      { name: "NEXT_PUBLIC_COPYRIGHT_EMAIL", check: emailAddress, note: "Copyright and trademark complaints" },
      { name: "NEXT_PUBLIC_MIN_AGE", check: (v) => (/^\d+$/.test(v) && Number(v) >= 13 && Number(v) <= 25 ? null : "Must be a whole number from 13 to 25"), note: "Defaults to 18" },
      { name: "RESTRICTED_COUNTRIES", check: (v) => (v.split(",").every((c) => /^[A-Za-z]{2}$/.test(c.trim())) ? null : "Comma-separated two-letter country codes, like US,GB"), note: "Where the service is not offered" },
    ],
  },
  {
    group: "Admin panel",
    rules: [
      { name: "ADMIN_URL", required: isProd, check: (v) => url(v) },
      {
        name: "ADMIN_WALLETS",
        required: true,
        check: (v) => {
          const bad = v.split(",").map((s) => s.trim()).filter(Boolean).filter((a) => base58Address(a) !== null).length
          return bad ? `${bad} entr${bad === 1 ? "y is" : "ies are"} not a valid Solana address` : null
        },
      },
      { name: "ADMIN_SESSION_SECRET", required: true, check: minLen(32) },
      { name: "ADMIN_IP_ALLOWLIST" },
    ],
  },
]

/** Every variable from .env.example as set, missing, invalid or optional-and-empty. Never returns values. */
export function envChecklist(): EnvRow[] {
  const rows: EnvRow[] = []
  for (const { group, rules } of ENV_GROUPS) {
    for (const r of rules) {
      const v = process.env[r.name]?.trim().replace(/^["']|["']$/g, "") ?? ""
      const required = typeof r.required === "function" ? r.required() : Boolean(r.required)
      if (!v) {
        rows.push({ name: r.name, group, state: required ? "missing" : "optional", note: r.note })
        continue
      }
      const problem = r.check?.(v) ?? null
      rows.push({ name: r.name, group, state: problem ? "invalid" : "set", note: problem ?? r.note })
    }
  }
  return rows
}

export function buildInfo() {
  const env = (k: string) => process.env[k]?.trim() || null
  return {
    environment: env("VERCEL_ENV") ?? (process.env.NODE_ENV === "production" ? "production (not on Vercel)" : "local"),
    commit: env("VERCEL_GIT_COMMIT_SHA"),
    branch: env("VERCEL_GIT_COMMIT_REF"),
    region: env("VERCEL_REGION"),
    deploymentId: env("VERCEL_DEPLOYMENT_ID"),
    instanceStarted: started,
  }
}
