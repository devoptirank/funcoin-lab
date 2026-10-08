import "server-only"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminConfigured, adminHost, isAdminHost, isAppHost, isSiteHost } from "@/lib/hosts"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { can, isAdminRole, type AdminRole, type Permission } from "./permissions"
import { getAdminCookieAccount } from "./session"

/**
 * The single gate for the admin panel. Every admin page calls requireAdmin() before fetching data,
 * and every admin route handler calls requireAdminApi(). Failures look like an ordinary 404, so the
 * panel's existence isn't revealed. Roles are re-read on every request, so removing an admin takes
 * effect immediately.
 */

export type AdminContext = { account: string; address: string; role: AdminRole; ip: string; userAgent: string }
export type AdminState =
  | { state: "anonymous" }
  | { state: "not-admin" }
  | { state: "needs-step-up"; account: string; address: string; role: AdminRole }
  | { state: "ok"; ctx: AdminContext }

/** ADMIN_WALLETS: comma-separated Solana addresses. Always owners; can't be removed from the UI. */
export function envOwners(): Set<string> {
  return new Set(
    (process.env.ADMIN_WALLETS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((a) => `sol:${a}`),
  )
}

/** Current role for an account: env owner, active admin_users row, or null. */
export async function getAdminRole(account: string): Promise<AdminRole | null> {
  if (envOwners().has(account)) return "owner"
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const { data, error } = await sb.from("admin_users").select("role, disabled_at").eq("account_id", account).maybeSingle()
  if (error || !data || data.disabled_at) return null
  return isAdminRole(data.role) ? data.role : null
}

function clientIp(h: Headers): string {
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim()
}

/** Admin pages and APIs are only served on the admin host, or on unsplit hosts (localhost, previews). */
function hostAllowed(host: string): boolean {
  if (!adminConfigured()) return true
  if (isAdminHost(host)) return true
  return !isSiteHost(host) && !isAppHost(host) && host !== adminHost()
}

function ipAllowed(ip: string): boolean {
  const list = (process.env.ADMIN_IP_ALLOWLIST ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  return !list.length || list.includes(ip)
}

export async function getAdminState(): Promise<AdminState> {
  const h = await headers()
  const host = (h.get("host") ?? "").toLowerCase()
  const ip = clientIp(h)
  if (!hostAllowed(host) || !ipAllowed(ip)) return { state: "not-admin" }
  const session = await getSession()
  if (!session) return { state: "anonymous" }
  const role = await getAdminRole(session.accountId)
  if (!role) return { state: "not-admin" }
  const cookieAccount = await getAdminCookieAccount()
  if (cookieAccount !== session.accountId) return { state: "needs-step-up", account: session.accountId, address: session.address, role }
  return { state: "ok", ctx: { account: session.accountId, address: session.address, role, ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300) } }
}

/** For admin pages: returns the admin context, or renders a 404. */
export async function requireAdmin(permission: Permission = "admin.view"): Promise<AdminContext> {
  const s = await getAdminState()
  if (s.state !== "ok" || !can(s.ctx.role, permission)) notFound()
  return s.ctx
}

const hidden = () => new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } })

/**
 * For admin route handlers: the admin context, or a 404 response. Non-GET requests must come from
 * the admin origin, and each admin is rate-limited.
 */
export async function requireAdminApi(req: Request, permission: Permission): Promise<AdminContext | NextResponse> {
  const s = await getAdminState()
  if (s.state !== "ok" || !can(s.ctx.role, permission)) return hidden()
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin")
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
    if (!origin || new URL(origin).host !== host) return hidden()
  }
  if (!rateLimit(clientKey(req, `admin:${s.ctx.account}`), 120, 60_000).ok) {
    return NextResponse.json({ error: "Too many admin requests. Wait a moment." }, { status: 429 })
  }
  return s.ctx
}
