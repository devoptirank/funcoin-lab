import type { Metadata } from "next"
import Link from "next/link"
import { CircleAlert, Download } from "lucide-react"
import { pageOf } from "@/lib/admin/api"
import { adminBase } from "@/lib/admin/base"
import { requireAdmin } from "@/lib/admin/guard"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { AdminHeader, Badge, Empty, Filters, Pager, Panel, Table, When, statusTone, usd } from "@/components/admin/ui"
import { JsonView } from "@/components/admin/billing/json-view"
import {
  GROUPS,
  METHODS,
  STATUSES,
  compact,
  eventFilters,
  eventsQuery,
  orderFilters,
  ordersQuery,
  overdue,
  revenueFilters,
  revenueReport,
  type EventRow,
  type OrderRow,
} from "@/components/admin/billing/data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Billing" }

type SP = Record<string, string | string[] | undefined>
type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

const TABS = [
  { id: "orders", label: "Orders" },
  { id: "webhooks", label: "Webhook log" },
  { id: "revenue", label: "Revenue" },
] as const
type Tab = (typeof TABS)[number]["id"]

const METHOD_LABEL: Record<string, string> = { sol: "SOL", usdc: "USDC", nowpayments: "NOWPayments" }

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden /> {children}
    </p>
  )
}

const exportLink = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"

export default async function BillingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await requireAdmin("billing.read")
  const sp = await searchParams
  const base = await adminBase()
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab
  const tab: Tab = TABS.some((t) => t.id === raw) ? (raw as Tab) : "orders"
  const sb = getSupabaseAdmin()
  const canExport = can(admin.role, "export.csv")

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminHeader title="Billing" description="Payment orders, provider webhooks and revenue. Orders are only marked paid after a verified payment." />

      <nav aria-label="Billing sections" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`${adminHref(base, "/billing")}${t.id === "orders" ? "" : `?tab=${t.id}`}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === t.id ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {!sb ? (
        <Notice>Supabase isn&apos;t connected on this deployment, so billing data is unavailable and the panel is read-only. Connect Supabase to see orders, webhooks and revenue.</Notice>
      ) : tab === "webhooks" ? (
        <WebhooksTab sb={sb} sp={sp} base={base} />
      ) : tab === "revenue" ? (
        <RevenueTab sb={sb} sp={sp} base={base} canExport={canExport} />
      ) : (
        <OrdersTab sb={sb} sp={sp} base={base} canExport={canExport} />
      )}
    </div>
  )
}

async function OrdersTab({ sb, sp, base, canExport }: { sb: SB; sp: SP; base: string; canExport: boolean }) {
  const f = orderFilters(sp)
  const { page, size, from, to } = pageOf(sp, 25)
  const { data, error } = await ordersQuery(sb, f).range(from, to + 1)
  const rows = ((data ?? []) as OrderRow[]).slice(0, size)
  const hasMore = (data?.length ?? 0) > size
  const params = compact(f)
  const href = adminHref(base, "/billing")
  const exportHref = `/api/admin/billing/export?${new URLSearchParams({ kind: "orders", ...params }).toString()}`

  return (
    <Panel
      title="Orders"
      actions={
        canExport ? (
          <a href={exportHref} className={exportLink}>
            <Download className="size-3.5" aria-hidden /> Export CSV
          </a>
        ) : undefined
      }
    >
      <Filters action={href}>
        <label>
          Search
          <input name="q" defaultValue={f.q} placeholder="Order id or wallet" className="w-48" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={f.status}>
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Method
          <select name="method" defaultValue={f.method}>
            <option value="">Any</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>{METHOD_LABEL[m]}</option>
            ))}
          </select>
        </label>
        <label>
          Created from
          <input type="date" name="from" defaultValue={f.from} />
        </label>
        <label>
          Created to
          <input type="date" name="to" defaultValue={f.to} />
        </label>
        <label>
          Min USD
          <input type="number" name="min" min={0} step="0.01" defaultValue={f.min} className="w-24" />
        </label>
        <label>
          Max USD
          <input type="number" name="max" min={0} step="0.01" defaultValue={f.max} className="w-24" />
        </label>
      </Filters>

      {error ? (
        <Notice>Couldn&apos;t load orders: {error.message}</Notice>
      ) : !rows.length ? (
        <Empty>No orders match these filters.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Wallet</th>
              <th>Pack</th>
              <th className="text-right">Credits</th>
              <th className="text-right">USD</th>
              <th>Method</th>
              <th>Status</th>
              <th>Created</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const late = overdue(o)
              return (
                <tr key={o.id} className={cn(late && "bg-amber-500/10")}>
                  <td>
                    <Link href={adminHref(base, `/billing/orders/${encodeURIComponent(o.id)}`)} className="font-mono text-xs underline-offset-2 hover:underline">
                      {o.id}
                    </Link>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1">
                      <Link href={adminHref(base, `/users/${encodeURIComponent(o.account_id)}`)} className="text-xs underline-offset-2 hover:underline">
                        User
                      </Link>
                      <MaskedAddress value={o.account_id} />
                    </span>
                  </td>
                  <td>{o.pack_id}</td>
                  <td className="text-right tabular-nums">{o.credits}</td>
                  <td className="text-right tabular-nums">{usd(Number(o.usd))}</td>
                  <td>{METHOD_LABEL[o.method] ?? o.method}</td>
                  <td>
                    <span className="inline-flex flex-wrap gap-1">
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                      {late && <Badge tone="bad">past expiry</Badge>}
                    </span>
                  </td>
                  <td><When iso={o.created_at} /></td>
                  <td><When iso={o.paid_at} /></td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
      <Pager base={href} params={params} page={page} hasMore={hasMore} />
    </Panel>
  )
}

async function WebhooksTab({ sb, sp, base }: { sb: SB; sp: SP; base: string }) {
  const f = eventFilters(sp)
  const { page, size, from, to } = pageOf(sp, 25)
  const { data, error } = await eventsQuery(sb, f).range(from, to + 1)
  const rows = ((data ?? []) as EventRow[]).slice(0, size)
  const hasMore = (data?.length ?? 0) > size
  const href = adminHref(base, "/billing")
  const params = { tab: "webhooks", ...compact({ provider: f.provider, estatus: f.status, order: f.order }) }

  return (
    <Panel title="Webhook log">
      <Filters action={href}>
        <input type="hidden" name="tab" value="webhooks" />
        <label>
          Provider
          <input name="provider" defaultValue={f.provider} placeholder="nowpayments" className="w-36" />
        </label>
        <label>
          Status
          <input name="estatus" defaultValue={f.status} placeholder="finished" className="w-32" />
        </label>
        <label>
          Order id
          <input name="order" defaultValue={f.order} placeholder="ord_..." className="w-56" />
        </label>
      </Filters>

      {error ? (
        <Notice>Couldn&apos;t load webhook events: {error.message}</Notice>
      ) : !rows.length ? (
        <Empty>No webhook events match these filters.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Received</th>
              <th>Provider</th>
              <th>Order</th>
              <th>Status</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td><When iso={e.created_at} /></td>
                <td>{e.provider}</td>
                <td>
                  {e.order_id ? (
                    <Link href={adminHref(base, `/billing/orders/${encodeURIComponent(e.order_id)}`)} className="font-mono text-xs underline-offset-2 hover:underline">
                      {e.order_id}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td><Badge tone={statusTone(e.status)}>{e.status || "none"}</Badge></td>
                <td><JsonView value={e.body} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager base={href} params={params} page={page} hasMore={hasMore} />
    </Panel>
  )
}

async function RevenueTab({ sb, sp, base, canExport }: { sb: SB; sp: SP; base: string; canExport: boolean }) {
  const f = revenueFilters(sp)
  const href = adminHref(base, "/billing")
  let report: Awaited<ReturnType<typeof revenueReport>> | null = null
  let failure = ""
  try {
    report = await revenueReport(sb, f)
  } catch (e) {
    failure = e instanceof Error ? e.message : "Query failed"
  }
  const exportHref = `/api/admin/billing/export?${new URLSearchParams({ kind: "revenue", rfrom: f.from, rto: f.to, group: f.group }).toString()}`
  const cells = (b: NonNullable<typeof report>["total"]) => (
    <>
      <td className="text-right tabular-nums">{b.orders}</td>
      <td className="text-right tabular-nums">{b.credits.toLocaleString("en-US")}</td>
      <td className="text-right tabular-nums">{usd(b.byMethod.sol.usd)}</td>
      <td className="text-right tabular-nums">{usd(b.byMethod.usdc.usd)}</td>
      <td className="text-right tabular-nums">{usd(b.byMethod.nowpayments.usd)}</td>
      <td className="text-right font-semibold tabular-nums">{usd(b.usd)}</td>
    </>
  )

  return (
    <Panel
      title="Revenue (paid orders, by paid date, UTC)"
      actions={
        canExport ? (
          <a href={exportHref} className={exportLink}>
            <Download className="size-3.5" aria-hidden /> Export CSV
          </a>
        ) : undefined
      }
    >
      <Filters action={href}>
        <input type="hidden" name="tab" value="revenue" />
        <label>
          From
          <input type="date" name="rfrom" defaultValue={f.from} />
        </label>
        <label>
          To
          <input type="date" name="rto" defaultValue={f.to} />
        </label>
        <label>
          Group by
          <select name="group" defaultValue={f.group}>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </Filters>

      {failure ? (
        <Notice>Couldn&apos;t load revenue: {failure}</Notice>
      ) : !report?.rows.length ? (
        <Empty>No paid orders between {f.from} and {f.to}.</Empty>
      ) : (
        <>
          {report.truncated && <p className="mb-3 text-xs text-destructive">Only the first 20,000 paid orders in this range were counted. Narrow the date range for exact totals.</p>}
          <Table>
            <thead>
              <tr>
                <th>{f.group === "week" ? "Week of (Monday)" : f.group === "month" ? "Month" : "Day"}</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Credits</th>
                <th className="text-right">SOL (USD)</th>
                <th className="text-right">USDC (USD)</th>
                <th className="text-right">NOWPayments (USD)</th>
                <th className="text-right">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((b) => (
                <tr key={b.period}>
                  <td className="font-mono text-xs">{b.period}</td>
                  {cells(b)}
                </tr>
              ))}
              <tr className="bg-foreground/[0.04] font-semibold">
                <td>Total</td>
                {cells(report.total)}
              </tr>
            </tbody>
          </Table>
        </>
      )}
    </Panel>
  )
}
