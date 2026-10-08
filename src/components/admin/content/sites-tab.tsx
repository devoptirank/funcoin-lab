import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AdminAction } from "@/components/admin/admin-action"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { Badge, Empty, Filters, Pager, Table, When, statusTone } from "@/components/admin/ui"
import { MascotArt } from "@/components/shared/mascot-art"
import type { SupabaseClient } from "@supabase/supabase-js"
import { listSites, openReportCounts, siteThumb, siteUrl, type SiteFilters } from "./data"

export type ContentPerms = { moderate: boolean; unpublish: boolean; feature: boolean; resolve: boolean; accountStatus: boolean }

export async function SitesTab({
  sb,
  base,
  filters,
  page,
  perms,
}: {
  sb: SupabaseClient
  base: string
  filters: SiteFilters
  page: { page: number; from: number; to: number }
  perms: ContentPerms
}) {
  const rows = await listSites(sb, filters, page.from, page.to + 1)
  const hasMore = rows.length > page.to - page.from + 1
  const sites = rows.slice(0, page.to - page.from + 1)
  const reports = await openReportCounts(sb, "site", sites.map((s) => s.id))
  const action = adminHref(base, "/content")
  const params: Record<string, string> = { tab: "sites" }
  if (filters.status !== "all") params.status = filters.status
  if (filters.featured !== "any") params.featured = filters.featured
  if (filters.q) params.q = filters.q

  return (
    <>
      <Filters action={action}>
        <input type="hidden" name="tab" value="sites" />
        <label>
          Search
          <input name="q" defaultValue={filters.q} placeholder="Slug or name" maxLength={64} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="all">All (published or moderated)</option>
            <option value="live">Live</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </select>
        </label>
        <label>
          Featured
          <select name="featured" defaultValue={filters.featured}>
            <option value="any">Any</option>
            <option value="yes">Featured</option>
            <option value="no">Not featured</option>
          </select>
        </label>
      </Filters>

      {sites.length === 0 ? (
        <Empty>No sites match these filters.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Site</th>
              <th>Owner</th>
              <th>Published</th>
              <th>Open reports</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => {
              const count = reports.get(s.id) ?? 0
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <MascotArt value={siteThumb(s)} className="size-10 shrink-0 rounded-md bg-foreground/5" />
                      <div className="min-w-0">
                        <p className="max-w-[16rem] truncate font-medium">{s.name}</p>
                        {s.published ? (
                          <a href={siteUrl(s.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
                            /site/{s.slug} <ExternalLink className="size-3" aria-hidden />
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">/site/{s.slug}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <MaskedAddress value={s.account_id} />
                      <Link href={adminHref(base, "/users/" + encodeURIComponent(s.account_id))} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                        View user
                      </Link>
                    </div>
                  </td>
                  <td>{s.published ? <When iso={s.published_at} /> : <Badge>Unpublished</Badge>}</td>
                  <td>{count > 0 ? <Badge tone="warn">{count} open</Badge> : <span className="text-muted-foreground">0</span>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={statusTone(s.moderation_status)}>{s.moderation_status}</Badge>
                      {s.featured && <Badge tone="good">featured</Badge>}
                    </div>
                    {s.moderation_reason && s.moderation_status !== "ok" && <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">{s.moderation_reason}</p>}
                  </td>
                  <td>
                    <SiteActions site={s} perms={perms} />
                  </td>
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

function SiteActions({ site, perms }: { site: { id: string; name: string; slug: string; published: boolean; moderation_status: string; featured: boolean }; perms: ContentPerms }) {
  const payload = { projectId: site.id }
  const items: React.ReactNode[] = []
  if (perms.moderate && site.moderation_status !== "hidden")
    items.push(
      <AdminAction
        key="hide"
        label="Hide"
        endpoint="/api/admin/content/sites/moderate"
        payload={{ ...payload, status: "hidden" }}
        title={`Hide ${site.name}`}
        description={`/site/${site.slug} stops being served and drops out of Discover and the sitemap. The owner sees the reason you give. You can restore it later.`}
        confirmLabel="Hide site"
      />,
    )
  if (perms.moderate && site.moderation_status !== "removed")
    items.push(
      <AdminAction
        key="remove"
        label="Remove"
        endpoint="/api/admin/content/sites/moderate"
        payload={{ ...payload, status: "removed" }}
        title={`Remove ${site.name}`}
        description={`/site/${site.slug} is taken down for breaking the rules and unfeatured. The owner sees the reason you give. You can restore it later.`}
        confirmLabel="Remove site"
        destructive
      />,
    )
  if (perms.moderate && site.moderation_status !== "ok")
    items.push(
      <AdminAction
        key="restore"
        label="Restore"
        endpoint="/api/admin/content/sites/moderate"
        payload={{ ...payload, status: "ok" }}
        title={`Restore ${site.name}`}
        description={`Clears the ${site.moderation_status} status. If the site is still published, /site/${site.slug} is served again.`}
        confirmLabel="Restore site"
      />,
    )
  if (perms.unpublish && site.published)
    items.push(
      <AdminAction
        key="unpublish"
        label="Unpublish"
        endpoint="/api/admin/content/sites/unpublish"
        payload={{ ...payload, slug: site.slug }}
        title={`Unpublish ${site.name}`}
        description={`Sets /site/${site.slug} to unpublished and unfeatures it. The owner can publish it again unless it is hidden or removed.`}
        confirmLabel="Unpublish"
        destructive
      />,
    )
  if (perms.feature && site.featured)
    items.push(
      <AdminAction
        key="unfeature"
        label="Unfeature"
        endpoint="/api/admin/content/sites/feature"
        payload={{ ...payload, featured: false }}
        title={`Unfeature ${site.name}`}
        description="Removes this site from Community picks on Discover."
        confirmLabel="Unfeature"
      />,
    )
  else if (perms.feature && site.published && site.moderation_status === "ok")
    items.push(
      <AdminAction
        key="feature"
        label="Feature"
        endpoint="/api/admin/content/sites/feature"
        payload={{ ...payload, featured: true }}
        title={`Feature ${site.name}`}
        description="Adds this site to Community picks on Discover. Featuring is editorial, for quality only, never paid."
        confirmLabel="Feature"
      />,
    )
  return items.length ? <div className="flex flex-wrap gap-1">{items}</div> : <span className="text-xs text-muted-foreground">View only</span>
}
