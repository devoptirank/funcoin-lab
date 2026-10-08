import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/admin/guard"
import { adminDb, csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { fetchAll, rangeOf } from "@/components/admin/ops/data"

const CAP = 5000

/** CSV of domain affiliate clicks for a date range (newest first, capped, audited). */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  const q = new URL(req.url).searchParams
  const range = rangeOf({ from: q.get("from") ?? undefined, to: q.get("to") ?? undefined }, 30)
  try {
    const sb = adminDb()
    const { rows, error } = await fetchAll<{ created_at: string; domain: string; source: string; account_id: string | null }>(
      (f, t) => sb.from("domain_clicks").select("created_at, domain, source, account_id").gte("created_at", range.fromIso).lt("created_at", range.toIso).order("created_at", { ascending: false }).range(f, t),
      CAP,
    )
    if (error) return NextResponse.json({ error }, { status: 500 })
    await auditEvent(ctx, { action: "export.csv", targetType: "domain_clicks", params: { from: range.fromKey, to: range.toKey, rows: rows.length } })
    return csvResponse(`domain-clicks-${range.fromKey}-to-${range.toKey}.csv`, ["created_at", "domain", "source", "account_id"], rows.map((r) => [r.created_at, r.domain, r.source, r.account_id]))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: (e as { status?: number }).status ?? 500 })
  }
}
