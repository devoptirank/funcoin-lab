import type { Metadata } from "next"
import type { SupabaseClient } from "@supabase/supabase-js"
import Link from "next/link"
import { requireAdmin } from "@/lib/admin/guard"
import { adminBase } from "@/lib/admin/base"
import { pageOf } from "@/lib/admin/api"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { AdminHeader, Empty, Pager, Panel, Table, When } from "@/components/admin/ui"
import { MaskedAddress } from "@/components/admin/masked-address"
import { BarChart } from "@/components/admin/charts"
import { ExportLink, NoDatabase, QueryError } from "@/components/admin/ops/kpi"
import { DAY_MS, countBy, dayKey, dayLabel, dayRange, fetchAll } from "@/components/admin/ops/data"

export const metadata: Metadata = { title: "Waitlist" }

const REF = "waitlist-token"
const CHART_DAYS = 60

async function loadWaitlist(sb: SupabaseClient, from: number, to: number) {
  const now = Date.now()
  const since = new Date(now - (CHART_DAYS - 1) * DAY_MS)
  const [list, total, recent] = await Promise.all([
    sb.from("bookmarks").select("account_id, created_at").eq("ref", REF).order("created_at", { ascending: false }).range(from, to + 1),
    sb.from("bookmarks").select("account_id", { count: "exact", head: true }).eq("ref", REF),
    fetchAll<{ created_at: string }>((f, t) => sb.from("bookmarks").select("created_at").eq("ref", REF).gte("created_at", `${dayKey(since)}T00:00:00.000Z`).order("created_at").range(f, t), 20_000),
  ])
  return { list, total, recent, since, now }
}

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("users.read")
  const sp = await searchParams
  const base = await adminBase()
  const { page, size, from, to } = pageOf(sp, 50)
  const sb = getSupabaseAdmin()

  if (!sb) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <AdminHeader title="Token waitlist" />
        <NoDatabase />
      </div>
    )
  }

  const { list, total, recent, since, now } = await loadWaitlist(sb, from, to)
  const error = list.error?.message ?? total.error?.message ?? recent.error
  const rows = (list.data ?? []) as { account_id: string; created_at: string }[]
  const hasMore = rows.length > size
  const perDay = countBy(recent.rows, (r) => dayKey(r.created_at))
  const chart = dayRange(since, new Date(now)).map((k) => ({ key: k, label: dayLabel(k), values: [perDay.get(k) ?? 0] }))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminHeader
        title="Token waitlist"
        description="Wallets that asked to be told when the token launches. Dates are shown in your timezone, the chart uses UTC days."
        actions={can(admin.role, "export.csv") ? <ExportLink href="/api/admin/waitlist/export" /> : undefined}
      />

      {error && <QueryError message={error} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Wallets on the waitlist</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{(total.count ?? 0).toLocaleString("en-US")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{recent.rows.length.toLocaleString("en-US")} joined in the last {CHART_DAYS} days</p>
        </div>
        <Panel title={`Joins per day, last ${CHART_DAYS} days`} className="lg:col-span-2">
          <BarChart title="Waitlist joins per day" data={chart} height={100} />
        </Panel>
      </div>

      <Panel title="Wallets">
        {rows.length === 0 ? (
          <Empty>{page > 1 ? "No more wallets." : "Nobody has joined the waitlist yet."}</Empty>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Wallet</th>
                  <th scope="col">Joined</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, size).map((r) => (
                  <tr key={r.account_id}>
                    <td>
                      <MaskedAddress value={r.account_id} />
                    </td>
                    <td>
                      <When iso={r.created_at} />
                    </td>
                    <td className="text-right">
                      <Link href={adminHref(base, "/users/" + encodeURIComponent(r.account_id))} className="text-sm underline-offset-2 hover:underline">
                        View user
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pager base={adminHref(base, "/waitlist")} params={{}} page={page} hasMore={hasMore} />
          </>
        )}
      </Panel>
    </div>
  )
}
