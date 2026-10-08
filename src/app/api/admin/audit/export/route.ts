import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/admin/guard"
import { adminDb, csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { fetchAll } from "@/components/admin/ops/data"
import { auditFilters, auditQuery, filterParams, type AuditRow } from "@/components/admin/ops/audit-query"

const CAP = 5000

/** CSV of the audit log for the current filters (newest first, capped, and itself audited). */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  const q = new URL(req.url).searchParams
  const f = auditFilters((k) => q.get(k) ?? undefined)
  try {
    const sb = adminDb()
    const { rows, error } = await fetchAll<AuditRow>((from, to) => auditQuery(sb, f).range(from, to) as unknown as PromiseLike<{ data: AuditRow[] | null; error: { message: string } | null }>, CAP)
    if (error) return NextResponse.json({ error }, { status: 500 })
    await auditEvent(ctx, { action: "export.csv", targetType: "audit", params: { filters: filterParams(f), rows: rows.length } })
    return csvResponse(
      `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      ["created_at", "admin_account", "role", "action", "target_type", "target_id", "reason", "params", "signed", "ip", "user_agent"],
      rows.map((r) => [r.created_at, r.admin_account, r.role, r.action, r.target_type, r.target_id, r.reason, r.params ?? {}, r.signature ? "yes" : "no", r.ip, r.user_agent]),
    )
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: (e as { status?: number }).status ?? 500 })
  }
}
