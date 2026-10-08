import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { AdminAction } from "@/components/admin/admin-action"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { Badge, Empty, Filters, Pager, Table, When, statusTone } from "@/components/admin/ui"
import { MascotArt } from "@/components/shared/mascot-art"
import { listReports, reportTargets, siteUrl, type ReportFilters, type ReportRow, type ReportTarget } from "./data"
import type { ContentPerms } from "./sites-tab"

export async function ReportsTab({
  sb,
  base,
  filters,
  page,
  perms,
}: {
  sb: SupabaseClient
  base: string
  filters: ReportFilters
  page: { page: number; from: number; to: number }
  perms: ContentPerms
}) {
  const size = page.to - page.from + 1
  const rows = await listReports(sb, filters, page.from, page.to + 1)
  const hasMore = rows.length > size
  const reports = rows.slice(0, size)
  const targets = await reportTargets(sb, reports)
  const action = adminHref(base, "/content")
  const params: Record<string, string> = { tab: "reports" }
  if (filters.status !== "open") params.status = filters.status
  if (filters.type) params.type = filters.type

  return (
    <>
      <Filters action={action}>
        <input type="hidden" name="tab" value="reports" />
        <label>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="open">Open</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All (open first)</option>
          </select>
        </label>
        <label>
          Target
          <select name="type" defaultValue={filters.type}>
            <option value="">Sites and images</option>
            <option value="site">Sites</option>
            <option value="asset">Images</option>
          </select>
        </label>
      </Filters>

      {reports.length === 0 ? (
        <Empty>{filters.status === "open" ? "No open reports. All clear." : "No reports match these filters."}</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Reported</th>
              <th>Reason</th>
              <th>Reporter</th>
              <th>Received</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const target = targets.get(`${r.target_type}:${r.target_id}`) ?? null
              return (
                <tr key={r.id}>
                  <td>
                    <TargetCell base={base} report={r} target={target} />
                  </td>
                  <td className="max-w-[18rem] break-words">{r.reason}</td>
                  <td>{r.reporter_account ? <MaskedAddress value={r.reporter_account} /> : <span className="text-xs text-muted-foreground">Anonymous</span>}</td>
                  <td>
                    <When iso={r.created_at} />
                  </td>
                  <td>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    {r.resolved_at && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <When iso={r.resolved_at} />
                      </p>
                    )}
                  </td>
                  <td>{r.status === "open" ? <ReportActions report={r} target={target} perms={perms} /> : <span className="text-xs text-muted-foreground">Resolved</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
      <Pager base={action} params={params} page={page.page} hasMore={hasMore} />
    </>
  )
}

function TargetCell({ base, report, target }: { base: string; report: ReportRow; target: ReportTarget | null }) {
  if (!target) return <span className="text-xs text-muted-foreground">{report.target_type === "site" ? "Site" : "Image"} no longer exists</span>
  const owner = (
    <Link href={adminHref(base, "/users/" + encodeURIComponent(target.owner))} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
      Owner
    </Link>
  )
  if (target.kind === "site") {
    return (
      <div className="flex items-center gap-2">
        <MascotArt value={target.thumb} className="size-10 shrink-0 rounded-md bg-foreground/5" />
        <div className="min-w-0">
          <p className="max-w-[14rem] truncate font-medium">{target.name}</p>
          <a href={siteUrl(target.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
            /site/{target.slug} <ExternalLink className="size-3" aria-hidden />
          </a>
          <div className="flex items-center gap-1.5">
            {target.moderation !== "ok" && <Badge tone={statusTone(target.moderation)}>{target.moderation}</Badge>}
            {!target.published && <Badge>unpublished</Badge>}
            {owner}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      {target.moderation === "removed" ? (
        <span className="flex size-10 items-center justify-center rounded-md bg-foreground/5 text-[10px] text-muted-foreground">deleted</span>
      ) : (
        <a href={target.url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- public storage URL */}
          <img src={target.url} alt={`Reported ${target.type} image`} className="size-10 rounded-md bg-foreground/5 object-contain" loading="lazy" />
        </a>
      )}
      <div>
        <p className="font-medium">{target.type} image</p>
        <div className="flex items-center gap-1.5">
          {target.moderation !== "ok" && <Badge tone={statusTone(target.moderation)}>{target.moderation}</Badge>}
          {owner}
        </div>
      </div>
    </div>
  )
}

function ReportActions({ report, target, perms }: { report: ReportRow; target: ReportTarget | null; perms: ContentPerms }) {
  const endpoint = "/api/admin/content/reports/resolve"
  const what = report.target_type === "site" ? "site" : "image"
  const items: React.ReactNode[] = []
  if (perms.resolve)
    items.push(
      <AdminAction
        key="dismiss"
        label="Dismiss"
        endpoint={endpoint}
        payload={{ reportId: report.id, action: "dismiss" }}
        title="Dismiss this report"
        description={`Closes the report as dismissed. Nothing changes on the ${what}.`}
        confirmLabel="Dismiss"
      />,
    )
  if (perms.resolve && perms.moderate && target && target.moderation !== "hidden" && target.moderation !== "removed")
    items.push(
      <AdminAction
        key="hide"
        label={`Hide ${what}`}
        endpoint={endpoint}
        payload={{ reportId: report.id, action: "hide" }}
        title={`Hide the reported ${what}`}
        description={`Hides the ${what} from the public (the owner sees your reason) and closes the report as actioned.`}
        confirmLabel={`Hide ${what}`}
      />,
    )
  if (perms.resolve && perms.moderate && target && target.moderation !== "removed")
    items.push(
      <AdminAction
        key="remove"
        label={`Remove ${what}`}
        endpoint={endpoint}
        payload={{ reportId: report.id, action: "remove" }}
        title={`Remove the reported ${what}`}
        description={
          what === "site"
            ? "Takes the site down as removed (the owner sees your reason) and closes the report as actioned."
            : "Marks the image removed, permanently deletes the file from storage, and closes the report as actioned."
        }
        confirmLabel={`Remove ${what}`}
        destructive
      />,
    )
  if (perms.resolve && perms.accountStatus && target)
    items.push(
      <AdminAction
        key="suspend"
        label="Suspend owner"
        endpoint={endpoint}
        payload={{ reportId: report.id, action: "suspend" }}
        title="Suspend the owner"
        description="Suspends the owner's wallet (they can't sign in to create or generate until reinstated) and closes the report as actioned. A banned owner stays banned."
        confirmLabel="Suspend owner"
        destructive
      />,
    )
  return items.length ? <div className="flex flex-wrap gap-1">{items}</div> : <span className="text-xs text-muted-foreground">View only</span>
}
