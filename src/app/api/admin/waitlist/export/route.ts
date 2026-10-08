import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/admin/guard"
import { adminDb, csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { fetchAll } from "@/components/admin/ops/data"

const CAP = 5000

/** CSV of token waitlist wallets (newest first, capped, audited). */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  try {
    const sb = adminDb()
    const { rows, error } = await fetchAll<{ account_id: string; created_at: string }>(
      (f, t) => sb.from("bookmarks").select("account_id, created_at").eq("ref", "waitlist-token").order("created_at", { ascending: false }).range(f, t),
      CAP,
    )
    if (error) return NextResponse.json({ error }, { status: 500 })
    await auditEvent(ctx, { action: "export.csv", targetType: "waitlist", params: { rows: rows.length } })
    return csvResponse(`waitlist-${new Date().toISOString().slice(0, 10)}.csv`, ["account_id", "address", "joined_at"], rows.map((r) => [r.account_id, r.account_id.replace(/^sol:/, ""), r.created_at]))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: (e as { status?: number }).status ?? 500 })
  }
}
