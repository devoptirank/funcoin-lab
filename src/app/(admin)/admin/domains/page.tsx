import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin/guard"
import { adminBase } from "@/lib/admin/base"
import { str } from "@/lib/admin/api"
import { can } from "@/lib/admin/permissions"
import { getDomainProvider } from "@/lib/domains"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { AdminHeader, Badge, Empty, Filters, Panel, Table } from "@/components/admin/ui"
import { BarChart, HBarChart } from "@/components/admin/charts"
import { ExportLink, NoDatabase, QueryError } from "@/components/admin/ops/kpi"
import { countBy, dayKey, dayLabel, dayRange, fetchAll, rangeOf, topOf } from "@/components/admin/ops/data"

export const metadata: Metadata = { title: "Domains" }

type Click = { domain: string; source: string; created_at: string }

export default async function DomainsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("admin.view")
  const sp = await searchParams
  const base = await adminBase()
  const range = rangeOf({ from: str(sp.from), to: str(sp.to) }, 30)
  const provider = getDomainProvider().id
  const affiliate = Boolean(process.env.NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE?.trim())
  const registrar = process.env.NEXT_PUBLIC_REGISTRAR_NAME?.trim() || "Dynadot"
  const sb = getSupabaseAdmin()

  const result = sb
    ? await fetchAll<Click>((f, t) => sb.from("domain_clicks").select("domain, source, created_at").gte("created_at", range.fromIso).lt("created_at", range.toIso).order("created_at").range(f, t), 20_000)
    : null
  const rows = result?.rows ?? []
  const byDomain = topOf(countBy(rows, (r) => r.domain), 100)
  const bySource = topOf(countBy(rows, (r) => r.source || "other"), 20)
  const perDay = countBy(rows, (r) => dayKey(r.created_at))
  const days = dayRange(new Date(range.fromIso), new Date(Date.parse(range.toIso) - 1)).map((k) => ({ key: k, label: dayLabel(k), values: [perDay.get(k) ?? 0] }))
  const exportHref = `/api/admin/domains/export?${new URLSearchParams({ from: range.fromKey, to: range.toKey })}`

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminHeader
        title="Domains and affiliates"
        description="Clicks on registrar buttons (through /go/domain), by domain, source and day. Dates are UTC."
        actions={sb && can(admin.role, "export.csv") ? <ExportLink href={exportHref} /> : undefined}
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Setup">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Availability provider</p>
          <p className="mt-1 font-semibold">{provider}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Affiliate link template</p>
          <p className="mt-1">
            <Badge tone={affiliate ? "good" : "warn"}>{affiliate ? "Set" : "Not set"}</Badge>
          </p>
          {!affiliate && <p className="mt-1 text-xs text-muted-foreground">Buttons use the plain registrar search link, so clicks earn nothing.</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Registrar shown to users</p>
          <p className="mt-1 font-semibold">{registrar}</p>
        </div>
      </section>

      <Filters action={adminHref(base, "/domains")}>
        <label>
          From
          <input type="date" name="from" defaultValue={range.fromKey} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={range.toKey} />
        </label>
      </Filters>

      {!sb && <NoDatabase />}
      {result?.error && <QueryError message={result.error} />}

      {sb && !result?.error && (
        <>
          <p className="text-sm text-muted-foreground">
            {rows.length.toLocaleString("en-US")} click{rows.length === 1 ? "" : "s"} from {range.fromKey} to {range.toKey}
            {result?.capped ? " (row cap reached, totals are lower bounds)" : ""}.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Clicks per day" className="lg:col-span-2">
              <BarChart title="Affiliate clicks per day" data={days} />
            </Panel>
            <Panel title="By source">
              <HBarChart title="Clicks by source" data={bySource.map(([label, value]) => ({ label, value }))} />
            </Panel>
          </div>
          <Panel title="By domain (top 100)">
            {byDomain.length === 0 ? (
              <Empty>No clicks in this date range.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th scope="col">Domain</th>
                    <th scope="col" className="text-right">
                      Clicks
                    </th>
                    <th scope="col" className="text-right">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byDomain.map(([domain, n]) => (
                    <tr key={domain}>
                      <td className="font-mono text-xs break-all">{domain}</td>
                      <td className="text-right tabular-nums">{n.toLocaleString("en-US")}</td>
                      <td className="text-right tabular-nums">{Math.round((n / rows.length) * 1000) / 10}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
