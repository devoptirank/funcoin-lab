import "server-only"
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * Account status (active, suspended, banned), enforced by withAccount, requireSession and every
 * /api/generate route. Cached for 30 seconds per account so it doesn't add a query to every request,
 * and last_seen_at is written at most every 5 minutes per account.
 */

export type AccountStatus = "active" | "suspended" | "banned"

const CACHE_MS = 30_000
const SEEN_MS = 5 * 60_000
const cache = new Map<string, { status: AccountStatus; reason: string | null; at: number }>()
const seen = new Map<string, number>()

export async function getAccountStatus(accountId: string): Promise<{ status: AccountStatus; reason: string | null }> {
  const hit = cache.get(accountId)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit
  const sb = getSupabaseAdmin()
  let status: AccountStatus = "active"
  let reason: string | null = null
  if (sb) {
    const { data } = await sb.from("billing_accounts").select("status, status_reason").eq("id", accountId).maybeSingle()
    if (data?.status === "suspended" || data?.status === "banned") status = data.status
    reason = data?.status_reason ?? null
  }
  const entry = { status, reason, at: Date.now() }
  cache.set(accountId, entry)
  if (cache.size > 5000) cache.delete(cache.keys().next().value!)
  void touchLastSeen(accountId)
  return entry
}

/** Forget the cached status (called after an admin changes it on this instance). */
export function forgetAccountStatus(accountId: string) {
  cache.delete(accountId)
}

async function touchLastSeen(accountId: string) {
  const last = seen.get(accountId) ?? 0
  if (Date.now() - last < SEEN_MS) return
  seen.set(accountId, Date.now())
  const sb = getSupabaseAdmin()
  if (!sb) return
  await sb.from("billing_accounts").update({ last_seen_at: new Date().toISOString() }).eq("id", accountId).then(
    () => undefined,
    () => undefined,
  )
}

/** A 403 response for blocked accounts, or null when the account may continue. */
export async function blockedAccountResponse(accountId: string): Promise<NextResponse | null> {
  const { status } = await getAccountStatus(accountId)
  if (status === "active") return null
  const message =
    status === "banned"
      ? "This wallet has been banned from FunCoin Lab. Contact us on Telegram if you think this is a mistake."
      : "This wallet is temporarily suspended. Contact us on Telegram (t.me/ravihere0) to resolve it."
  return NextResponse.json({ error: message, code: "account_" + status }, { status: 403 })
}
