import type { Metadata } from "next"
import Link from "next/link"
import { CircleAlert, Download } from "lucide-react"
import { pageOf } from "@/lib/admin/api"
import { adminBase } from "@/lib/admin/base"
import { requireAdmin } from "@/lib/admin/guard"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { AdminHeader, Panel } from "@/components/admin/ui"
import { imageFilters, reportFilters, siteFilters, tabOf, type ContentTab } from "@/components/admin/content/data"
import { ImagesTab } from "@/components/admin/content/images-tab"
import { ReportsTab } from "@/components/admin/content/reports-tab"
import { SitesTab, type ContentPerms } from "@/components/admin/content/sites-tab"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Content" }

const TABS: { id: ContentTab; label: string }[] = [
  { id: "sites", label: "Published sites" },
  { id: "images", label: "Generated images" },
  { id: "reports", label: "Reports" },
]

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("content.read")
  const sp = await searchParams
  const base = await adminBase()
  const tab = tabOf(sp)
  const sb = getSupabaseAdmin()
  const perms: ContentPerms = {
    moderate: can(admin.role, "content.moderate"),
    unpublish: can(admin.role, "sites.unpublish"),
    feature: can(admin.role, "content.feature"),
    resolve: can(admin.role, "reports.resolve"),
    accountStatus: can(admin.role, "accounts.status"),
  }

  // Export the current tab with its current filters (page excluded).
  const exportParams = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) if (k !== "page" && typeof v === "string" && v) exportParams.set(k, v)
  exportParams.set("tab", tab)
  const openCount = sb ? (await sb.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open")).count ?? 0 : 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminHeader
        title="Content"
        description="Moderate published sites and generated images, and work through user reports."
        actions={
          can(admin.role, "export.csv") && sb ? (
            <a href={`/api/admin/content/export?${exportParams.toString()}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-foreground/5">
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          ) : undefined
        }
      />

      <nav aria-label="Content sections" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-1 border-b border-border">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                href={`${adminHref(base, "/content")}?tab=${t.id}`}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm",
                  tab === t.id ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.id === "reports" && openCount > 0 && <span className="rounded bg-amber-500/20 px-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{openCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!sb ? (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Supabase isn&apos;t connected on this deployment, so there is no content to moderate.
        </p>
      ) : (
        <Panel>
          {tab === "sites" && <SitesTab sb={sb} base={base} filters={siteFilters(sp)} page={pageOf(sp, 25)} perms={perms} />}
          {tab === "images" && <ImagesTab sb={sb} base={base} filters={imageFilters(sp)} page={pageOf(sp, 24)} perms={perms} />}
          {tab === "reports" && <ReportsTab sb={sb} base={base} filters={reportFilters(sp)} page={pageOf(sp, 25)} perms={perms} />}
        </Panel>
      )}
    </div>
  )
}
