import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { str } from "@/lib/admin/api"

/**
 * Filters and queries shared by the Users list page and its CSV export, so both always show the
 * same set of wallets. Aggregates are fetched with one query per related table for the whole page
 * of accounts (never one query per account) and summed in JS.
 */

export const ACCOUNT_RE = /^sol:[1-9A-HJ-NP-Za-km-z]{32,44}$/
const SEARCH_RE = /^[1-9A-HJ-NP-Za-km-z]{1,44}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Decode and validate an account path segment. Returns null when it isn't a wallet account id. */
export function parseAccountParam(raw: string): string | null {
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    return null
  }
  return ACCOUNT_RE.test(value) ? value : null
}

export type UserFilters = {
  q: string
  status: "" | "active" | "suspended" | "banned"
  paid: "" | "yes" | "no"
  from: string
  to: string
  sort: "newest" | "oldest" | "seen"
}

export function parseUserFilters(sp: Record<string, string | string[] | undefined>): { filters: UserFilters; invalidSearch: boolean } {
  const rawQ = str(sp.q).replace(/^sol:/i, "")
  const invalidSearch = rawQ !== "" && !SEARCH_RE.test(rawQ)
  const status = str(sp.status)
  const paid = str(sp.paid)
  const sort = str(sp.sort)
  const from = str(sp.from)
  const to = str(sp.to)
  return {
    invalidSearch,
    filters: {
      q: invalidSearch ? "" : rawQ,
      status: status === "active" || status === "suspended" || status === "banned" ? status : "",
      paid: paid === "yes" || paid === "no" ? paid : "",
      from: DATE_RE.test(from) ? from : "",
      to: DATE_RE.test(to) ? to : "",
      sort: sort === "oldest" || sort === "seen" ? sort : "newest",
    },
  }
}

/** Only the filters that are set, for links and the audit log. */
export function filterParams(f: UserFilters): Record<string, string> {
  return Object.fromEntries(Object.entries(f).filter(([k, v]) => v !== "" && !(k === "sort" && v === "newest"))) as Record<string, string>
}

const nextDay = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString()

export type AccountRow = {
  id: string
  wallet: string
  created_at: string
  status: string
  status_reason: string | null
  last_seen_at: string | null
  projects: { count: number }[] | null
}

/** One page of billing_accounts matching the filters, newest first by default. */
export async function listAccounts(sb: SupabaseClient, f: UserFilters, from: number, to: number): Promise<AccountRow[]> {
  const embedPaid = f.paid === "yes" ? ", payment_orders!inner(id)" : f.paid === "no" ? ", payment_orders(id)" : ""
  let query = sb.from("billing_accounts").select(`id, wallet, created_at, status, status_reason, last_seen_at, projects(count)${embedPaid}`)
  if (f.q) query = query.ilike("id", `%${f.q}%`)
  if (f.status) query = query.eq("status", f.status)
  if (f.from) query = query.gte("created_at", `${f.from}T00:00:00Z`)
  if (f.to) query = query.lt("created_at", nextDay(f.to))
  if (f.paid) query = query.eq("payment_orders.status", "paid")
  if (f.paid === "no") query = query.is("payment_orders", null)
  if (f.sort === "seen") query = query.order("last_seen_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
  else query = query.order("created_at", { ascending: f.sort === "oldest" })
  const { data, error } = await query.range(from, to)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AccountRow[]
}

/**
 * All rows of `table` for these accounts, read in chunks of 1000 (the PostgREST row cap) so sums
 * are complete. Capped at `maxRows`; `truncated` says when the cap was hit.
 */
export async function fetchForAccounts<T>(
  sb: SupabaseClient,
  table: string,
  columns: string,
  ids: string[],
  eq?: [column: string, value: string],
  maxRows = 50_000,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = []
  if (!ids.length) return { rows, truncated: false }
  const chunk = 1000
  for (let offset = 0; offset < maxRows; offset += chunk) {
    let q = sb.from(table).select(columns).in("account_id", ids)
    if (eq) q = q.eq(eq[0], eq[1])
    const { data, error } = await q.order("account_id").order("id").range(offset, offset + chunk - 1)
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < chunk) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

export type UserSummary = AccountRow & { balance: number; projectCount: number; paidUsd: number }

/** Balance and paid USD for a page of accounts: one ledger query and one orders query in total. */
export async function withAggregates(sb: SupabaseClient, accounts: AccountRow[]): Promise<{ users: UserSummary[]; truncated: boolean }> {
  const ids = accounts.map((a) => a.id)
  const [ledger, orders] = await Promise.all([
    fetchForAccounts<{ account_id: string; delta: number }>(sb, "credit_ledger", "account_id, delta", ids),
    fetchForAccounts<{ account_id: string; usd: number | string }>(sb, "payment_orders", "account_id, usd", ids, ["status", "paid"]),
  ])
  const balance = new Map<string, number>()
  for (const r of ledger.rows) balance.set(r.account_id, (balance.get(r.account_id) ?? 0) + Number(r.delta))
  const paid = new Map<string, number>()
  for (const r of orders.rows) paid.set(r.account_id, (paid.get(r.account_id) ?? 0) + Number(r.usd))
  return {
    truncated: ledger.truncated || orders.truncated,
    users: accounts.map((a) => ({ ...a, balance: balance.get(a.id) ?? 0, projectCount: a.projects?.[0]?.count ?? 0, paidUsd: paid.get(a.id) ?? 0 })),
  }
}
