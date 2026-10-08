import "server-only"

/** Shared server helpers for the Operations pages (overview, domains, waitlist, audit). */

export const DAY_MS = 24 * 60 * 60 * 1000

/** Supabase returns at most 1000 rows per request, so read in pages up to `cap` rows. */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  cap = 20_000,
  size = 1000,
): Promise<{ rows: T[]; capped: boolean; error: string | null }> {
  const rows: T[] = []
  for (let from = 0; from < cap; from += size) {
    const to = Math.min(from + size, cap) - 1
    const { data, error } = await page(from, to)
    if (error) return { rows, capped: false, error: error.message }
    rows.push(...(data ?? []))
    if (!data || data.length < to - from + 1) return { rows, capped: false, error: null }
  }
  return { rows, capped: true, error: null }
}

/** UTC day key, "2026-10-09". */
export const dayKey = (d: Date | string | number) => new Date(d).toISOString().slice(0, 10)

/** Every UTC day key from `from` to `to` inclusive (capped at 400 days). */
export function dayRange(from: Date, to: Date): string[] {
  const out: string[] = []
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  for (let t = start; t <= to.getTime() && out.length < 400; t += DAY_MS) out.push(dayKey(t))
  return out
}

/** Short axis label for a day key: "Oct 9". */
export const dayLabel = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/** Escape a user string for ilike patterns. */
export const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/** Date range from searchParams `from`/`to` (YYYY-MM-DD, UTC). Defaults to the last `days` days. */
export function rangeOf(sp: { from?: string; to?: string }, days = 30, maxDays = 366) {
  const valid = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) ? s : "")
  const now = new Date()
  const toKey = valid(sp.to) || dayKey(now)
  let fromKey = valid(sp.from) || dayKey(Date.parse(`${toKey}T00:00:00Z`) - (days - 1) * DAY_MS)
  if (fromKey > toKey) fromKey = toKey
  const earliest = dayKey(Date.parse(`${toKey}T00:00:00Z`) - (maxDays - 1) * DAY_MS)
  if (fromKey < earliest) fromKey = earliest
  return {
    fromKey,
    toKey,
    fromIso: `${fromKey}T00:00:00.000Z`,
    /** Exclusive upper bound: the start of the day after `to`. */
    toIso: new Date(Date.parse(`${toKey}T00:00:00Z`) + DAY_MS).toISOString(),
  }
}

/** Count rows per key. */
export function countBy<T>(rows: T[], key: (r: T) => string | null | undefined): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = key(r)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

/** Sorted [key, count] pairs, biggest first. */
export const topOf = (m: Map<string, number>, n = 50) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n)
