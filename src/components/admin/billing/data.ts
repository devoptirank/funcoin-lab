import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { str } from "@/lib/admin/api"

/**
 * Shared reads for the Billing admin section (orders list, webhook log, revenue report, CSV
 * exports). Everything here is read-only. Orders are only ever marked paid through
 * getBillingStore().fulfillOrder, and balances only change through admin_adjust_credits.
 */

type SP = Record<string, string | string[] | undefined>

export const METHODS = ["sol", "usdc", "nowpayments"] as const
export const STATUSES = ["pending", "paid", "expired", "failed", "partial"] as const
export const GROUPS = ["day", "week", "month"] as const
export type Group = (typeof GROUPS)[number]

export type OrderRow = {
  id: string
  account_id: string
  pack_id: string
  credits: number
  usd: number | string
  method: string
  amount: string
  currency: string
  recipient: string | null
  reference: string | null
  signature: string | null
  provider_id: string | null
  status: string
  created_at: string
  expires_at: string
  paid_at: string | null
}

export type EventRow = { id: string; provider: string; order_id: string | null; status: string | null; body: unknown; created_at: string }

const DATE = /^\d{4}-\d{2}-\d{2}$/
const date = (v: string) => (DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : "")
const num = (v: string) => (v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 ? v : "")
const pick = <T extends readonly string[]>(list: T, v: string) => ((list as readonly string[]).includes(v) ? v : "")
/** Day after a YYYY-MM-DD date, as an ISO timestamp (exclusive upper bound). */
export const dayAfter = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString()
/** Escape LIKE wildcards in user or id input (order ids contain "_"). */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

// ---------------- Orders ----------------

export type OrderFilters = { status: string; method: string; from: string; to: string; min: string; max: string; q: string }

export function orderFilters(sp: SP): OrderFilters {
  return {
    status: pick(STATUSES, str(sp.status)),
    method: pick(METHODS, str(sp.method)),
    from: date(str(sp.from)),
    to: date(str(sp.to)),
    min: num(str(sp.min)),
    max: num(str(sp.max)),
    // Order id or part of a wallet address. Restricted characters keep PostgREST filter syntax out.
    q: str(sp.q).replace(/[^A-Za-z0-9_:]/g, "").slice(0, 64),
  }
}

/** Non-empty filters only, for links and pager params. */
export const compact = (f: Record<string, string>) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""))

export function ordersQuery(sb: SupabaseClient, f: OrderFilters) {
  let q = sb.from("payment_orders").select("*")
  if (f.status) q = q.eq("status", f.status)
  if (f.method) q = q.eq("method", f.method)
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00Z`)
  if (f.to) q = q.lt("created_at", dayAfter(f.to))
  if (f.min) q = q.gte("usd", Number(f.min))
  if (f.max) q = q.lte("usd", Number(f.max))
  if (f.q) {
    const address = f.q.replace(/^sol:/, "")
    q = q.or(`id.eq.${f.q},account_id.ilike.*${escapeLike(address)}*`)
  }
  return q.order("created_at", { ascending: false }).order("id", { ascending: false })
}

/** Pending orders whose payment window has passed. */
export const overdue = (o: Pick<OrderRow, "status" | "expires_at">) => o.status === "pending" && Date.parse(o.expires_at) < Date.now()

/**
 * Read up to `cap` rows in pages of 1000 (PostgREST caps a single response at 1000 rows by default).
 * `build` must return a fresh, fully filtered and ordered query each time.
 */
export async function readAll<T>(
  build: () => { range: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }> },
  cap: number,
): Promise<T[]> {
  const out: T[] = []
  const size = 1000
  while (out.length < cap) {
    const from = out.length
    const to = Math.min(cap, from + size) - 1
    const { data, error } = await build().range(from, to)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < to - from + 1) break
  }
  return out
}

// ---------------- Webhooks ----------------

export type EventFilters = { provider: string; status: string; order: string }

export function eventFilters(sp: SP): EventFilters {
  const clean = (v: string) => v.replace(/[^A-Za-z0-9_:.-]/g, "").slice(0, 64)
  return { provider: clean(str(sp.provider)), status: clean(str(sp.estatus)), order: clean(str(sp.order)) }
}

export function eventsQuery(sb: SupabaseClient, f: EventFilters) {
  let q = sb.from("payment_events").select("id, provider, order_id, status, body, created_at")
  if (f.provider) q = q.eq("provider", f.provider)
  if (f.status) q = q.eq("status", f.status)
  if (f.order) q = q.eq("order_id", f.order)
  return q.order("created_at", { ascending: false }).order("id", { ascending: false })
}

// ---------------- Revenue ----------------

export const REVENUE_CAP = 20_000

export type RevenueFilters = { from: string; to: string; group: Group }

export function revenueFilters(sp: SP): RevenueFilters {
  const today = new Date().toISOString().slice(0, 10)
  const to = date(str(sp.rto)) || today
  const from = date(str(sp.rfrom)) || new Date(Date.parse(`${to}T00:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10)
  const group = (pick(GROUPS, str(sp.group)) || "day") as Group
  return from <= to ? { from, to, group } : { from: to, to: from, group }
}

export type RevenueBucket = {
  period: string
  orders: number
  credits: number
  usd: number
  byMethod: Record<(typeof METHODS)[number], { orders: number; usd: number }>
}

const emptyMethods = () => ({ sol: { orders: 0, usd: 0 }, usdc: { orders: 0, usd: 0 }, nowpayments: { orders: 0, usd: 0 } })

/** UTC period key: YYYY-MM-DD for days, the Monday of the ISO week for weeks, YYYY-MM for months. */
function periodOf(iso: string, group: Group): string {
  const d = new Date(iso)
  if (group === "month") return iso.slice(0, 7)
  if (group === "day") return d.toISOString().slice(0, 10)
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)))
  return monday.toISOString().slice(0, 10)
}

/** Paid orders in the range, aggregated in JS. Rows are read once, capped at REVENUE_CAP. */
export async function revenueReport(sb: SupabaseClient, f: RevenueFilters) {
  const rows = await readAll<{ method: string; usd: number | string; credits: number; paid_at: string }>(
    () =>
      sb
        .from("payment_orders")
        .select("method, usd, credits, paid_at")
        .eq("status", "paid")
        .gte("paid_at", `${f.from}T00:00:00Z`)
        .lt("paid_at", dayAfter(f.to))
        .order("paid_at", { ascending: true })
        .order("id", { ascending: true }),
    REVENUE_CAP,
  )
  const buckets = new Map<string, RevenueBucket>()
  const total: RevenueBucket = { period: "Total", orders: 0, credits: 0, usd: 0, byMethod: emptyMethods() }
  for (const r of rows) {
    if (!r.paid_at) continue
    const key = periodOf(r.paid_at, f.group)
    let b = buckets.get(key)
    if (!b) buckets.set(key, (b = { period: key, orders: 0, credits: 0, usd: 0, byMethod: emptyMethods() }))
    const usd = Number(r.usd) || 0
    const m = (METHODS as readonly string[]).includes(r.method) ? (r.method as (typeof METHODS)[number]) : null
    for (const t of [b, total]) {
      t.orders += 1
      t.credits += r.credits
      t.usd += usd
      if (m) {
        t.byMethod[m].orders += 1
        t.byMethod[m].usd += usd
      }
    }
  }
  const list = [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period))
  return { rows: list, total, truncated: rows.length >= REVENUE_CAP }
}

export const REVENUE_HEADER = ["period", "orders", "credits", "usd_total", "sol_orders", "sol_usd", "usdc_orders", "usdc_usd", "nowpayments_orders", "nowpayments_usd"]
export const revenueCsvRow = (b: RevenueBucket) => [
  b.period,
  b.orders,
  b.credits,
  b.usd.toFixed(2),
  b.byMethod.sol.orders,
  b.byMethod.sol.usd.toFixed(2),
  b.byMethod.usdc.orders,
  b.byMethod.usdc.usd.toFixed(2),
  b.byMethod.nowpayments.orders,
  b.byMethod.nowpayments.usd.toFixed(2),
]

// ---------------- Display helpers ----------------

export function solscanTx(signature: string) {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet-beta"
  return `https://solscan.io/tx/${encodeURIComponent(signature)}${cluster !== "mainnet-beta" ? `?cluster=${encodeURIComponent(cluster)}` : ""}`
}

/** Quoted amount in human units: lamports to SOL, USDC base units to USDC, NOWPayments in USD. */
export function displayAmount(o: Pick<OrderRow, "method" | "amount" | "currency">) {
  if (o.method === "sol") return `${(Number(o.amount) / 1e9).toFixed(6).replace(/\.?0+$/, "")} SOL`
  if (o.method === "usdc") return `${(Number(o.amount) / 1e6).toFixed(2)} USDC`
  return `${o.amount} ${o.currency.toUpperCase()}`
}
