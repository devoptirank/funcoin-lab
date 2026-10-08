import { NextResponse } from "next/server"
import { adminDb, csvResponse } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { requireAdminApi } from "@/lib/admin/guard"
import {
  imageFilters,
  listImages,
  listReports,
  listSites,
  openReportCounts,
  reportFilters,
  siteFilters,
  siteUrl,
  tabOf,
} from "@/components/admin/content/data"

const CAP = 5000
const BATCH = 500

/** Pages through a list query in batches up to the cap. */
async function collect<T>(load: (from: number, to: number) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < CAP; from += BATCH) {
    const size = Math.min(BATCH, CAP - from)
    const page = await load(from, from + size - 1)
    out.push(...page)
    if (page.length < size) break
  }
  return out
}

/** CSV of the current Content tab and filters (up to 5000 rows). Audited. */
export async function GET(req: Request) {
  const ctx = await requireAdminApi(req, "export.csv")
  if (ctx instanceof NextResponse) return ctx
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries())
  const tab = tabOf(sp)
  const stamp = new Date().toISOString().slice(0, 10)
  try {
    const sb = adminDb()
    let header: string[]
    let rows: unknown[][]
    let params: Record<string, unknown>
    if (tab === "sites") {
      const f = siteFilters(sp)
      params = f
      const sites = await collect((from, to) => listSites(sb, f, from, to))
      const counts = new Map<string, number>()
      for (let i = 0; i < sites.length; i += BATCH) {
        for (const [k, v] of await openReportCounts(sb, "site", sites.slice(i, i + BATCH).map((s) => s.id))) counts.set(k, v)
      }
      header = ["project_id", "name", "slug", "url", "owner", "published", "published_at", "moderation_status", "moderation_reason", "featured", "open_reports", "updated_at"]
      rows = sites.map((s) => [s.id, s.name, s.slug, siteUrl(s.slug), s.account_id, s.published, s.published_at, s.moderation_status, s.moderation_reason, s.featured, counts.get(s.id) ?? 0, s.updated_at])
    } else if (tab === "images") {
      const f = imageFilters(sp)
      params = f
      const images = await collect((from, to) => listImages(sb, f, from, to))
      header = ["asset_id", "type", "owner", "concept_id", "moderation_status", "moderation_reason", "url", "created_at"]
      rows = images.map((a) => [a.id, a.type, a.account_id, a.concept_id, a.moderation_status, a.moderation_reason, a.url, a.created_at])
    } else {
      const f = reportFilters(sp)
      params = f
      const reports = await collect((from, to) => listReports(sb, f, from, to))
      header = ["report_id", "target_type", "target_id", "reason", "reporter", "status", "created_at", "resolved_by", "resolved_at"]
      rows = reports.map((r) => [r.id, r.target_type, r.target_id, r.reason, r.reporter_account, r.status, r.created_at, r.resolved_by, r.resolved_at])
    }
    await auditEvent(ctx, { action: "export.csv", targetType: `content.${tab}`, params: { ...params, rows: rows.length }, reason: "CSV export" })
    return csvResponse(`funcoin-content-${tab}-${stamp}.csv`, header, rows)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    return NextResponse.json({ error: status === 503 ? "Supabase isn't connected" : "Export failed" }, { status, headers: { "Cache-Control": "no-store" } })
  }
}
