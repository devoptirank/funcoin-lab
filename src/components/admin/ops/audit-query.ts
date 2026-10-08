import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { likeEscape, rangeOf } from "./data"

/** Audit log filters, shared by the Audit page and its CSV export so both return the same rows. */

export type AuditFilters = { admin: string; action: string; targetType: string; targetId: string; from: string; to: string }

export const AUDIT_COLS = "id, admin_account, role, action, target_type, target_id, params, reason, signature, ip, user_agent, created_at"

export type AuditRow = {
  id: string
  admin_account: string
  role: string
  action: string
  target_type: string | null
  target_id: string | null
  params: Record<string, unknown> | null
  reason: string
  signature: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

const clip = (s: string | null | undefined, n = 120) => (s ?? "").trim().slice(0, n)

const dateOnly = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) && !Number.isNaN(Date.parse(s.trim())) ? s.trim() : "")

export function auditFilters(get: (k: string) => string | undefined): AuditFilters {
  return {
    admin: clip(get("admin")),
    action: clip(get("action"), 60),
    targetType: clip(get("target_type"), 40),
    targetId: clip(get("target_id")),
    from: dateOnly(get("from")),
    to: dateOnly(get("to")),
  }
}

/** Only non-empty filters, for links and the Pager. */
export const filterParams = (f: AuditFilters) =>
  Object.fromEntries(
    Object.entries({ admin: f.admin, action: f.action, target_type: f.targetType, target_id: f.targetId, from: f.from, to: f.to }).filter(([, v]) => v),
  ) as Record<string, string>

/** A select on admin_audit with the filters applied, newest first. */
export function auditQuery(sb: SupabaseClient, f: AuditFilters, cols = AUDIT_COLS) {
  let q = sb.from("admin_audit").select(cols)
  if (f.admin) q = q.ilike("admin_account", `%${likeEscape(f.admin)}%`)
  if (f.action) q = q.ilike("action", `${likeEscape(f.action)}%`)
  if (f.targetType) q = q.eq("target_type", f.targetType)
  if (f.targetId) q = q.ilike("target_id", `%${likeEscape(f.targetId)}%`)
  if (f.from || f.to) {
    const r = rangeOf({ from: f.from || "2000-01-01", to: f.to || undefined }, 1, 100_000)
    if (f.from) q = q.gte("created_at", r.fromIso)
    if (f.to) q = q.lt("created_at", r.toIso)
  }
  return q.order("created_at", { ascending: false })
}
