import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { DAY_MS, dayKey, dayLabel, dayRange, fetchAll } from "./data"
import type { BarPoint } from "@/components/admin/charts"

/**
 * Overview KPIs. One read per table for the last 60 days (only the needed columns, paged, capped),
 * then everything is aggregated here, so the page costs about ten queries no matter the range.
 *
 * Definitions (all times UTC):
 * - New wallets: billing_accounts created.
 * - Active wallets: distinct accounts with an activity row or a credit_ledger row.
 * - Projects created: projects.created_at. Sites published: projects.published_at on currently published projects.
 * - AI images: generated_assets rows.
 * - Credits sold / revenue: payment_orders with status paid, by paid_at (usd split by method).
 * - Credits spent: negative ledger entries that are not admin adjustments (ref "admin:"), minus automatic
 *   image refunds (ref "refund:").
 * - Domain affiliate clicks: domain_clicks rows. Waitlist signups: bookmarks with ref "waitlist-token".
 */

const CAP = 20_000
const WINDOW_DAYS = 60

type Period = { id: "today" | "7d" | "30d"; label: string; cur: [number, number]; prev: [number, number] }

export type KpiValue = { cur: number; prev: number }
export type KpiSet = {
  newWallets: KpiValue
  activeWallets: KpiValue
  projects: KpiValue
  published: KpiValue
  images: KpiValue
  creditsSold: KpiValue
  creditsSpent: KpiValue
  revenue: KpiValue
  revenueSol: KpiValue
  revenueUsdc: KpiValue
  revenueNow: KpiValue
  clicks: KpiValue
  waitlist: KpiValue
}

export type OverviewData = {
  periods: { id: Period["id"]; label: string; kpis: KpiSet }[]
  revenueDaily: BarPoint[]
  signupsDaily: BarPoint[]
  imagesByType: { label: string; value: number }[]
  imagesLast24h: number
  capped: string[]
  errors: string[]
}

function periods(now: number): Period[] {
  const d = new Date(now)
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const span = (days: number): [number, number] => [now - days * DAY_MS, now]
  return [
    // Today so far vs yesterday up to the same time.
    { id: "today", label: "Today", cur: [midnight, now], prev: [midnight - DAY_MS, now - DAY_MS] },
    { id: "7d", label: "7 days", cur: span(7), prev: [now - 14 * DAY_MS, now - 7 * DAY_MS] },
    { id: "30d", label: "30 days", cur: span(30), prev: [now - 60 * DAY_MS, now - 30 * DAY_MS] },
  ]
}

const t = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN)
const inRange = (ms: number, [a, b]: [number, number]) => ms >= a && ms < b

export async function loadOverview(sb: SupabaseClient, now = Date.now()): Promise<OverviewData> {
  const since = new Date(now - WINDOW_DAYS * DAY_MS).toISOString()
  const page = <T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>) =>
    fetchAll<T>((from, to) => build(from, to) as PromiseLike<{ data: T[] | null; error: { message: string } | null }>, CAP)

  const [accounts, activity, ledger, projects, assets, orders, clicks, waitlist] = await Promise.all([
    page<{ created_at: string }>((f, to) => sb.from("billing_accounts").select("created_at").gte("created_at", since).order("created_at").range(f, to)),
    page<{ account_id: string; created_at: string }>((f, to) => sb.from("activity").select("account_id, created_at").gte("created_at", since).order("created_at").range(f, to)),
    page<{ account_id: string; delta: number; ref: string; created_at: string }>((f, to) =>
      sb.from("credit_ledger").select("account_id, delta, ref, created_at").gte("created_at", since).order("created_at").range(f, to),
    ),
    page<{ created_at: string; published: boolean; published_at: string | null }>((f, to) =>
      sb.from("projects").select("created_at, published, published_at").or(`created_at.gte.${since},published_at.gte.${since}`).order("created_at").range(f, to),
    ),
    page<{ type: string; created_at: string }>((f, to) => sb.from("generated_assets").select("type, created_at").gte("created_at", since).order("created_at").range(f, to)),
    page<{ method: string; usd: number | string; credits: number; paid_at: string }>((f, to) =>
      sb.from("payment_orders").select("method, usd, credits, paid_at").eq("status", "paid").gte("paid_at", since).order("paid_at").range(f, to),
    ),
    page<{ created_at: string }>((f, to) => sb.from("domain_clicks").select("created_at").gte("created_at", since).order("created_at").range(f, to)),
    page<{ created_at: string }>((f, to) => sb.from("bookmarks").select("created_at").eq("ref", "waitlist-token").gte("created_at", since).order("created_at").range(f, to)),
  ])

  const named = { accounts, activity, ledger, projects, assets, orders, clicks, waitlist }
  const capped = Object.entries(named).filter(([, r]) => r.capped).map(([k]) => k)
  const errors = Object.entries(named).filter(([, r]) => r.error).map(([k, r]) => `${k}: ${r.error}`)

  const count = (rows: { created_at: string }[], range: [number, number]) => rows.reduce((n, r) => n + (inRange(t(r.created_at), range) ? 1 : 0), 0)
  const kv = (fn: (range: [number, number]) => number, p: Period): KpiValue => ({ cur: fn(p.cur), prev: fn(p.prev) })

  const active = (range: [number, number]) => {
    const set = new Set<string>()
    for (const r of activity.rows) if (inRange(t(r.created_at), range)) set.add(r.account_id)
    for (const r of ledger.rows) if (inRange(t(r.created_at), range)) set.add(r.account_id)
    return set.size
  }
  const spent = (range: [number, number]) => {
    let n = 0
    for (const r of ledger.rows) {
      if (!inRange(t(r.created_at), range)) continue
      if (r.delta < 0 && !r.ref.startsWith("admin:")) n += -r.delta
      else if (r.delta > 0 && r.ref.startsWith("refund:")) n -= r.delta
    }
    return Math.max(0, n)
  }
  const paid = (range: [number, number], method?: string, field: "usd" | "credits" = "usd") =>
    orders.rows.reduce((n, o) => n + (inRange(t(o.paid_at), range) && (!method || o.method === method) ? Number(o[field]) || 0 : 0), 0)

  const out = periods(now).map((p) => ({
    id: p.id,
    label: p.label,
    kpis: {
      newWallets: kv((r) => count(accounts.rows, r), p),
      activeWallets: kv(active, p),
      projects: kv((r) => count(projects.rows, r), p),
      published: kv((r) => projects.rows.reduce((n, x) => n + (x.published && inRange(t(x.published_at), r) ? 1 : 0), 0), p),
      images: kv((r) => count(assets.rows, r), p),
      creditsSold: kv((r) => paid(r, undefined, "credits"), p),
      creditsSpent: kv(spent, p),
      revenue: kv((r) => paid(r), p),
      revenueSol: kv((r) => paid(r, "sol"), p),
      revenueUsdc: kv((r) => paid(r, "usdc"), p),
      revenueNow: kv((r) => paid(r, "nowpayments"), p),
      clicks: kv((r) => count(clicks.rows, r), p),
      waitlist: kv((r) => count(waitlist.rows, r), p),
    },
  }))

  // Daily charts: the last 30 UTC days including today.
  const days = dayRange(new Date(now - 29 * DAY_MS), new Date(now))
  const idx = new Map(days.map((k, i) => [k, i]))
  const methods = ["sol", "usdc", "nowpayments"]
  const revenueDaily: BarPoint[] = days.map((k) => ({ key: k, label: dayLabel(k), values: [0, 0, 0] }))
  for (const o of orders.rows) {
    const i = idx.get(dayKey(o.paid_at))
    const m = methods.indexOf(o.method)
    if (i !== undefined && m >= 0) revenueDaily[i].values[m] += Number(o.usd) || 0
  }
  const signupsDaily: BarPoint[] = days.map((k) => ({ key: k, label: dayLabel(k), values: [0] }))
  for (const a of accounts.rows) {
    const i = idx.get(dayKey(a.created_at))
    if (i !== undefined) signupsDaily[i].values[0] += 1
  }
  const since30 = now - 30 * DAY_MS
  const byType = new Map<string, number>()
  for (const a of assets.rows) if (t(a.created_at) >= since30) byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
  const imagesByType = ["logo", "mascot", "meme", "banner", "site-hero"].map((label) => ({ label, value: byType.get(label) ?? 0 }))
  const imagesLast24h = assets.rows.reduce((n, a) => n + (t(a.created_at) >= now - DAY_MS ? 1 : 0), 0)

  return { periods: out, revenueDaily, signupsDaily, imagesByType, imagesLast24h, capped, errors }
}

export type Attention = {
  expiredPending: number | null
  partial: number | null
  failedIpn: number | null
  openReports: number | null
}

/** Counts for the needs-attention list. A null means the query failed (for example a missing table). */
export async function loadAttention(sb: SupabaseClient, now = Date.now()): Promise<Attention> {
  const nowIso = new Date(now).toISOString()
  const head = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await q
    return error ? null : (count ?? 0)
  }
  const [expiredPending, partial, failedIpn, openReports] = await Promise.all([
    head(sb.from("payment_orders").select("id", { count: "exact", head: true }).eq("status", "pending").lt("expires_at", nowIso)),
    head(sb.from("payment_orders").select("id", { count: "exact", head: true }).eq("status", "partial")),
    head(sb.from("payment_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(now - 30 * DAY_MS).toISOString())),
    head(sb.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open")),
  ])
  return { expiredPending, partial, failedIpn, openReports }
}
