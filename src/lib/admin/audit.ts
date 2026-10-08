import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { AdminContext } from "./guard"

/**
 * The actor block every admin SQL function receives, so each mutation and its audit row are written
 * in one transaction (see supabase/migrations/0006_admin.sql).
 */
export function actor(ctx: Pick<AdminContext, "account" | "role" | "ip" | "userAgent">, signature?: string) {
  return { account: ctx.account, role: ctx.role, ip: ctx.ip, ua: ctx.userAgent, signature: signature ?? null }
}

/**
 * Audit events that don't change data (sign-in, sign-out, CSV export). Mutations are audited inside
 * their SQL function instead. The table is append-only: nothing in the code updates or deletes it.
 */
export async function auditEvent(
  ctx: Pick<AdminContext, "account" | "role" | "ip" | "userAgent">,
  event: { action: string; targetType?: string; targetId?: string; params?: Record<string, unknown>; reason?: string },
) {
  const sb = getSupabaseAdmin()
  if (!sb) return
  const { error } = await sb.from("admin_audit").insert({
    admin_account: ctx.account,
    role: ctx.role,
    action: event.action,
    target_type: event.targetType ?? null,
    target_id: event.targetId ?? null,
    params: event.params ?? {},
    reason: event.reason ?? event.action,
    ip: ctx.ip || null,
    user_agent: ctx.userAgent || null,
  })
  if (error) console.error("[admin-audit] write failed:", error.message)
}
