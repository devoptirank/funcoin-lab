import { NextResponse } from "next/server"
import { csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { requireAdminApi } from "@/lib/admin/guard"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import {
  REVENUE_HEADER,
  compact,
  orderFilters,
  ordersQuery,
  readAll,
  revenueCsvRow,
  revenueFilters,
  revenueReport,
  type OrderRow,
} from "@/components/admin/billing/data"

const CAP = 5000

/** CSV export of the current Billing filter. ?kind=orders (default) or ?kind=revenue. Capped and audited. */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ error: "Supabase isn't connected" }, { status: 503 })
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries())
  const stamp = new Date().toISOString().slice(0, 10)

  try {
    if (sp.kind === "revenue") {
      const f = revenueFilters(sp)
      const report = await revenueReport(sb, f)
      const rows = [...report.rows.slice(0, CAP).map(revenueCsvRow), revenueCsvRow(report.total)]
      await auditEvent(ctx, { action: "export.csv", targetType: "billing", targetId: "revenue", params: { ...f, rows: rows.length, truncated: report.truncated } })
      return csvResponse(`revenue-${f.group}-${f.from}-to-${f.to}.csv`, REVENUE_HEADER, rows)
    }

    const f = orderFilters(sp)
    const orders = await readAll<OrderRow>(() => ordersQuery(sb, f), CAP)
    await auditEvent(ctx, { action: "export.csv", targetType: "billing", targetId: "orders", params: { ...compact(f), rows: orders.length, cap: CAP } })
    return csvResponse(
      `orders-${stamp}.csv`,
      ["id", "account", "pack", "credits", "usd", "method", "amount", "currency", "status", "signature", "provider_id", "created_at", "expires_at", "paid_at"],
      orders.map((o) => [o.id, o.account_id, o.pack_id, o.credits, Number(o.usd).toFixed(2), o.method, o.amount, o.currency, o.status, o.signature, o.provider_id, o.created_at, o.expires_at, o.paid_at]),
    )
  } catch (error) {
    console.error("[admin-billing] export failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
