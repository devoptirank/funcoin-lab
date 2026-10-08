import { NextResponse } from "next/server"
import { adminDb, csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { requireAdminApi } from "@/lib/admin/guard"
import { filterParams, listAccounts, parseUserFilters, withAggregates } from "@/components/admin/users/users-query"

const CAP = 5000
const BATCH = 500

/** CSV of the wallets matching the Users list filters (up to 5000 rows). Audited. */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries())
  const { filters } = parseUserFilters(sp)
  try {
    const sb = adminDb()
    const rows: (string | number | null)[][] = []
    let truncated = false
    for (let from = 0; from < CAP; from += BATCH) {
      const page = await listAccounts(sb, filters, from, Math.min(from + BATCH, CAP) - 1)
      const { users, truncated: t } = await withAggregates(sb, page)
      truncated ||= t
      for (const u of users) rows.push([u.id, u.wallet, u.status, u.status_reason, u.balance, u.projectCount, u.paidUsd.toFixed(2), u.created_at, u.last_seen_at])
      if (page.length < Math.min(BATCH, CAP - from)) break
    }
    await auditEvent(ctx, { action: "export.csv", targetType: "users", params: { ...filterParams(filters), rows: rows.length, partialTotals: truncated }, reason: "CSV export" })
    const stamp = new Date().toISOString().slice(0, 10)
    return csvResponse(`funcoin-users-${stamp}.csv`, ["account", "wallet", "status", "status_reason", "balance", "projects", "paid_usd", "created_at", "last_seen_at"], rows)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    return NextResponse.json({ error: status === 503 ? "Supabase isn't connected" : "Export failed" }, { status, headers: { "Cache-Control": "no-store" } })
  }
}
