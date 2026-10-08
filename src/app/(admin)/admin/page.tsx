import type { Metadata } from "next"
import Link from "next/link"
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { adminBase } from "@/lib/admin/base"
import { runHealthChecks } from "@/lib/admin/health"
import { getSetting } from "@/lib/settings"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { AdminHeader, Panel } from "@/components/admin/ui"
import { BarChart, HBarChart, seriesColor } from "@/components/admin/charts"
import { KpiTile, NoDatabase } from "@/components/admin/ops/kpi"
import { loadAttention, loadOverview, type Attention, type OverviewData } from "@/components/admin/ops/overview"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Overview" }

/** Whether migration 0006 has been applied (admin tables exist). */
async function adminSchemaReady(): Promise<boolean | null> {
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const { error } = await sb.from("admin_audit").select("id", { head: true, count: "exact" }).limit(1)
  return !error
}

const PERIOD_IDS = ["today", "7d", "30d"] as const
const PREV_LABEL = { today: "yesterday so far", "7d": "previous 7 days", "30d": "previous 30 days" } as const

type Item = { tone: "warn" | "bad"; text: string; href?: string }

export default async function AdminOverview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("admin.view")
  const sp = await searchParams
  const base = await adminBase()
  const periodId = PERIOD_IDS.find((p) => p === sp.period) ?? "today"
  const sb = getSupabaseAdmin()

  const [schema, data, attention, limits, health] = await Promise.all([
    adminSchemaReady(),
    sb ? loadOverview(sb).catch((e: unknown) => (console.error("[admin overview]", e), null)) : Promise.resolve(null),
    sb ? loadAttention(sb).catch(() => null) : Promise.resolve(null),
    getSetting("limits"),
    runHealthChecks({ timeoutMs: 2500 }),
  ])

  const items: Item[] = []
  const a: Attention | null = attention
  if (a?.expiredPending) items.push({ tone: "warn", text: `${a.expiredPending} pending order${a.expiredPending === 1 ? "" : "s"} past expiry`, href: adminHref(base, "/billing?status=pending") })
  if (a?.partial) items.push({ tone: "warn", text: `${a.partial} partial payment${a.partial === 1 ? "" : "s"} to review`, href: adminHref(base, "/billing?status=partial") })
  if (a?.failedIpn) items.push({ tone: "bad", text: `${a.failedIpn} failed NOWPayments IPN event${a.failedIpn === 1 ? "" : "s"} in the last 30 days`, href: adminHref(base, "/billing") })
  if (a?.openReports) items.push({ tone: "warn", text: `${a.openReports} open content report${a.openReports === 1 ? "" : "s"}`, href: adminHref(base, "/content") })
  if (data && limits.globalDailyImages > 0) {
    const used = data.imagesLast24h / limits.globalDailyImages
    if (used >= 0.8)
      items.push({
        tone: used >= 1 ? "bad" : "warn",
        text: `${data.imagesLast24h} of ${limits.globalDailyImages} daily AI images used in the last 24 hours (${Math.round(used * 100)}%)`,
        href: adminHref(base, "/settings"),
      })
  }
  for (const h of health.filter((x) => x.status === "down")) items.push({ tone: "bad", text: `${h.label} is down: ${h.detail}`, href: adminHref(base, "/system") })
  if (sb && attention === null) items.push({ tone: "warn", text: "Couldn't load the attention checks (is migration 0006 applied?)" })

  const current = data?.periods.find((p) => p.id === periodId)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AdminHeader title="Overview" description={`Signed in as ${admin.role}. Times are UTC.`} />

      {!sb && <NoDatabase />}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Setup status">
        {[
          { label: "Database", ok: Boolean(sb), text: sb ? "Connected" : "Not connected" },
          { label: "Admin tables (0006)", ok: schema === true, text: schema === null ? "Unknown" : schema ? "Ready" : "Run migration 0006" },
          { label: "Your role", ok: true, text: admin.role },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold">
              {t.ok ? <CircleCheck className="size-4 text-[var(--lab-text)]" aria-hidden /> : <CircleAlert className="size-4 text-destructive" aria-hidden />} {t.text}
            </p>
          </div>
        ))}
      </section>

      <Panel title="Needs attention">
        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-[var(--lab-text)]" aria-hidden /> Nothing needs attention right now.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((it) => (
              <li key={it.text} className="flex items-start gap-2">
                {it.tone === "bad" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Problem" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Warning" />}
                {it.href ? (
                  <Link href={it.href} className="underline-offset-2 hover:underline">
                    {it.text}
                  </Link>
                ) : (
                  <span>{it.text}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {sb && !data && <p className="text-sm text-destructive">Couldn&apos;t load the KPIs. Check the server logs.</p>}

      {data && current && (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="kpi-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="kpi-heading" className="font-semibold">
                Key numbers
              </h2>
              <nav aria-label="Period" className="flex rounded-lg border border-border p-0.5 text-sm">
                {data.periods.map((p) => (
                  <Link
                    key={p.id}
                    href={`${adminHref(base, "/")}?period=${p.id}`}
                    aria-current={p.id === periodId ? "page" : undefined}
                    className={cn("rounded-md px-3 py-1", p.id === periodId ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                  >
                    {p.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Kpis data={data} periodId={periodId} />
            {(data.capped.length > 0 || data.errors.length > 0) && (
              <p className="text-xs text-muted-foreground">
                {data.capped.length > 0 && `Some totals are lower bounds (row cap reached for: ${data.capped.join(", ")}). `}
                {data.errors.length > 0 && `Some data failed to load: ${data.errors.join("; ")}`}
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Revenue, last 30 days">
              <BarChart
                title="Daily revenue (USD)"
                format="usd"
                data={data.revenueDaily}
                series={[
                  { name: "SOL", color: seriesColor(0) },
                  { name: "USDC", color: seriesColor(1) },
                  { name: "NOWPayments", color: seriesColor(2) },
                ]}
              />
            </Panel>
            <Panel title="Signups, last 30 days">
              <BarChart title="New wallets per day" data={data.signupsDaily} series={[{ name: "New wallets", color: seriesColor(0) }]} />
            </Panel>
            <Panel title="AI images by type, last 30 days" className="lg:col-span-2">
              <HBarChart title="Images generated" data={data.imagesByType} />
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

function Kpis({ data, periodId }: { data: OverviewData; periodId: (typeof PERIOD_IDS)[number] }) {
  const p = data.periods.find((x) => x.id === periodId)!
  const k = p.kpis
  const prevLabel = PREV_LABEL[periodId]
  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiTile label="New wallets" {...k.newWallets} prevLabel={prevLabel} />
      <KpiTile label="Active wallets" {...k.activeWallets} prevLabel={prevLabel} />
      <KpiTile label="Projects created" {...k.projects} prevLabel={prevLabel} />
      <KpiTile label="Sites published" {...k.published} prevLabel={prevLabel} />
      <KpiTile label="AI images generated" {...k.images} prevLabel={prevLabel} />
      <KpiTile label="Credits sold" {...k.creditsSold} prevLabel={prevLabel} />
      <KpiTile label="Credits spent" {...k.creditsSpent} prevLabel={prevLabel} />
      <KpiTile
        label="Revenue (USD)"
        format="usd"
        {...k.revenue}
        prevLabel={prevLabel}
        detail={`SOL ${money(k.revenueSol.cur)}, USDC ${money(k.revenueUsdc.cur)}, NOWPayments ${money(k.revenueNow.cur)}`}
      />
      <KpiTile label="Domain affiliate clicks" {...k.clicks} prevLabel={prevLabel} />
      <KpiTile label="Waitlist signups" {...k.waitlist} prevLabel={prevLabel} />
    </div>
  )
}
