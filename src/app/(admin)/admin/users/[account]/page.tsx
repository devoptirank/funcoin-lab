import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ArrowLeft } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { adminDb, pageOf, str } from "@/lib/admin/api"
import { adminBase } from "@/lib/admin/base"
import { getSetting } from "@/lib/settings"
import { SITE_URL } from "@/lib/hosts"
import { cn } from "@/lib/utils"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { AdminHeader, Badge, Empty, Pager, Panel, Table, When, statusTone, usd } from "@/components/admin/ui"
import { Notice, readError } from "@/components/admin/users/notice"
import { UserActions } from "@/components/admin/users/user-actions"
import { fetchForAccounts, parseAccountParam } from "@/components/admin/users/users-query"

export const metadata: Metadata = { title: "User" }

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "ledger", label: "Credit ledger" },
  { id: "orders", label: "Orders" },
  { id: "projects", label: "Projects" },
  { id: "images", label: "Images" },
  { id: "activity", label: "Activity" },
  { id: "domains", label: "Saved domains" },
  { id: "audit", label: "Audit history" },
] as const
type Tab = (typeof TABS)[number]["id"]

const SIZE = 50

type Account = {
  id: string
  wallet: string
  created_at: string
  status: string
  status_reason: string | null
  status_changed_at: string | null
  last_seen_at: string | null
  notes: string | null
}

type Row = Record<string, unknown>

const short = (account: string) => {
  const a = account.replace(/^sol:/, "")
  return `${a.slice(0, 4)}…${a.slice(-4)}`
}

/** A compact one-line preview of a JSON value. */
const preview = (v: unknown, max = 140) => {
  const s = typeof v === "string" ? v : JSON.stringify(v ?? {})
  return s.length > max ? `${s.slice(0, max)}...` : s
}

async function loadTab(sb: SupabaseClient, tab: Tab, account: string, from: number, to: number): Promise<Row[]> {
  const range = <T,>(q: { range: (a: number, b: number) => T }) => q.range(from, to + 1)
  let res: { data: unknown[] | null; error: { message: string } | null }
  switch (tab) {
    case "ledger":
      res = await range(sb.from("credit_ledger").select("id, delta, reason, ref, created_at").eq("account_id", account).order("created_at", { ascending: false }))
      break
    case "orders":
      res = await range(sb.from("payment_orders").select("id, pack_id, credits, usd, method, amount, currency, status, signature, created_at, paid_at").eq("account_id", account).order("created_at", { ascending: false }))
      break
    case "projects":
      res = await range(sb.from("projects").select("id, name, slug, published, published_at, moderation_status, featured, created_at, updated_at").eq("account_id", account).order("updated_at", { ascending: false }))
      break
    case "images":
      res = await range(sb.from("generated_assets").select("id, type, pose, storage_path, moderation_status, created_at").eq("account_id", account).order("created_at", { ascending: false }))
      break
    case "activity":
      res = await range(sb.from("activity").select("id, kind, input, created_at").eq("account_id", account).order("created_at", { ascending: false }))
      break
    case "domains":
      res = await range(sb.from("saved_domains").select("domain, topic, status, created_at").eq("account_id", account).order("created_at", { ascending: false }))
      break
    case "audit":
      res = await range(sb.from("admin_audit").select("id, admin_account, role, action, params, reason, signature, created_at").eq("target_type", "account").eq("target_id", account).order("created_at", { ascending: false }))
      break
    default:
      return []
  }
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as Row[]
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const admin = await requireAdmin("users.read")
  const account = parseAccountParam((await params).account)
  if (!account) notFound()
  const sp = await searchParams
  const base = await adminBase()
  const rawTab = str(sp.tab)
  const tab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : "summary"
  const { page, from, to } = pageOf(sp, SIZE)

  const listHref = adminHref(base, "/users")
  const selfHref = adminHref(base, `/users/${encodeURIComponent(account)}`)
  const back = (
    <Link href={listHref} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> All users
    </Link>
  )

  let sb: SupabaseClient
  let acct: Account | null = null
  let balance = 0
  let spent = 0
  let paidUsd = 0
  let paidOrders = 0
  let publishedCount = 0
  let partial = false
  let rows: Row[] = []
  try {
    sb = adminDb()
    const { data, error } = await sb
      .from("billing_accounts")
      .select("id, wallet, created_at, status, status_reason, status_changed_at, last_seen_at, notes")
      .eq("id", account)
      .maybeSingle()
    if (error) throw new Error(error.message)
    acct = data as Account | null
    if (acct) {
      const [ledger, orders, published, tabRows] = await Promise.all([
        fetchForAccounts<{ delta: number }>(sb, "credit_ledger", "delta", [account]),
        fetchForAccounts<{ usd: number | string }>(sb, "payment_orders", "usd", [account], ["status", "paid"]),
        sb.from("projects").select("id", { count: "exact", head: true }).eq("account_id", account).eq("published", true),
        tab === "summary" ? Promise.resolve([] as Row[]) : loadTab(sb, tab, account, from, to),
      ])
      for (const r of ledger.rows) {
        balance += Number(r.delta)
        if (r.delta < 0) spent += -Number(r.delta)
      }
      for (const r of orders.rows) paidUsd += Number(r.usd)
      paidOrders = orders.rows.length
      publishedCount = published.count ?? 0
      partial = ledger.truncated || orders.truncated
      rows = tabRows
    }
  } catch (e) {
    return (
      <div className="mx-auto max-w-6xl">
        {back}
        <AdminHeader title="User" />
        <Notice>{readError(e)}</Notice>
      </div>
    )
  }

  if (!acct) {
    return (
      <div className="mx-auto max-w-6xl">
        {back}
        <AdminHeader title="User" />
        <Panel>
          <Empty>No account exists for this wallet address.</Empty>
        </Panel>
      </div>
    )
  }

  const hasMore = rows.length > SIZE
  rows = rows.slice(0, SIZE)
  const { supportCreditCap } = await getSetting("limits")
  const tabHref = (id: Tab) => (id === "summary" ? selfHref : `${selfHref}?tab=${id}`)

  return (
    <div className="mx-auto flex max-w-6xl flex-col">
      {back}
      <AdminHeader
        title={short(account)}
        description={acct.wallet}
        actions={
          <UserActions
            role={admin.role}
            account={account}
            short={short(account)}
            status={acct.status}
            notes={acct.notes ?? ""}
            cap={supportCreditCap}
            publishedCount={publishedCount}
            isSelf={account === admin.account}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={statusTone(acct.status)}>{acct.status}</Badge>
        <MaskedAddress value={account} />
        <span className="text-muted-foreground">Balance {balance.toLocaleString("en-US")} credits</span>
      </div>

      <nav aria-label="User sections" className="mb-4 -mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-border text-sm">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                href={tabHref(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-2",
                  tab === t.id ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "summary" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Account">
            {partial && <p className="mb-3 text-xs text-muted-foreground">This account has a very long history, so totals may be partial.</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm [&_dt]:text-muted-foreground">
              <dt>Balance</dt>
              <dd className="tabular-nums">{balance.toLocaleString("en-US")} credits</dd>
              <dt>Lifetime spend</dt>
              <dd className="tabular-nums">{spent.toLocaleString("en-US")} credits</dd>
              <dt>Lifetime paid</dt>
              <dd className="tabular-nums">
                {usd(paidUsd)} <span className="text-muted-foreground">({paidOrders} {paidOrders === 1 ? "order" : "orders"})</span>
              </dd>
              <dt>Published sites</dt>
              <dd className="tabular-nums">{publishedCount}</dd>
              <dt>First seen</dt>
              <dd>
                <When iso={acct.created_at} />
              </dd>
              <dt>Last seen</dt>
              <dd>
                <When iso={acct.last_seen_at} />
              </dd>
            </dl>
          </Panel>
          <Panel title="Status">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm [&_dt]:text-muted-foreground">
              <dt>Status</dt>
              <dd>
                <Badge tone={statusTone(acct.status)}>{acct.status}</Badge>
              </dd>
              <dt>Reason</dt>
              <dd className="break-words">{acct.status_reason || <span className="text-muted-foreground">-</span>}</dd>
              <dt>Changed</dt>
              <dd>
                <When iso={acct.status_changed_at} />
              </dd>
            </dl>
          </Panel>
          <Panel title="Internal notes" className="lg:col-span-2">
            {acct.notes ? <p className="text-sm whitespace-pre-wrap break-words">{acct.notes}</p> : <Empty>No notes yet.</Empty>}
          </Panel>
        </div>
      ) : (
        <Panel>
          {rows.length === 0 ? (
            <Empty>Nothing here yet.</Empty>
          ) : (
            <TabTable tab={tab} rows={rows} sb={sb} />
          )}
          <Pager base={selfHref} params={{ tab }} page={page} hasMore={hasMore} />
        </Panel>
      )}
    </div>
  )
}

const muted = (text = "-") => <span className="text-muted-foreground">{text}</span>
const s = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v))

function TabTable({ tab, rows, sb }: { tab: Tab; rows: Row[]; sb: SupabaseClient }) {
  if (tab === "images") {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {rows.map((r) => {
          const url = sb.storage.from("generated").getPublicUrl(s(r.storage_path)).data.publicUrl
          return (
            <li key={s(r.id)} className="overflow-hidden rounded-lg border border-border">
              <a href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-foreground/5">
                {/* eslint-disable-next-line @next/next/no-img-element -- user uploads from the public bucket */}
                <img src={url} alt={`${s(r.type)} image`} loading="lazy" className="size-full object-cover" />
              </a>
              <div className="flex flex-col gap-1 p-2 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium">{s(r.type)}</span>
                  {r.moderation_status !== "ok" && <Badge tone={statusTone(s(r.moderation_status))}>{s(r.moderation_status)}</Badge>}
                </div>
                <When iso={s(r.created_at)} />
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  if (tab === "ledger") {
    return (
      <Table>
        <thead>
          <tr>
            <th>When</th>
            <th className="text-right">Change</th>
            <th>Reason</th>
            <th>Ref</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={s(r.id)}>
              <td>
                <When iso={s(r.created_at)} />
              </td>
              <td className={cn("text-right tabular-nums", Number(r.delta) < 0 ? "text-destructive" : "")}>
                {Number(r.delta) > 0 ? "+" : ""}
                {Number(r.delta).toLocaleString("en-US")}
              </td>
              <td className="break-words">{s(r.reason)}</td>
              <td className="font-mono text-xs break-all">{s(r.ref)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  if (tab === "orders") {
    return (
      <Table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Order</th>
            <th>Status</th>
            <th>Method</th>
            <th className="text-right">Credits</th>
            <th className="text-right">USD</th>
            <th>Amount</th>
            <th>Paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={s(r.id)}>
              <td>
                <When iso={s(r.created_at)} />
              </td>
              <td className="font-mono text-xs break-all">{s(r.id)}</td>
              <td>
                <Badge tone={statusTone(s(r.status))}>{s(r.status)}</Badge>
              </td>
              <td>{s(r.method)}</td>
              <td className="text-right tabular-nums">{Number(r.credits).toLocaleString("en-US")}</td>
              <td className="text-right tabular-nums">{usd(Number(r.usd))}</td>
              <td className="whitespace-nowrap">
                {s(r.amount)} {s(r.currency)}
              </td>
              <td>
                <When iso={s(r.paid_at) || null} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  if (tab === "projects") {
    return (
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Published</th>
            <th>Moderation</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={s(r.id)}>
              <td className="font-medium break-words">
                {s(r.name)} {r.featured === true && <Badge>featured</Badge>}
              </td>
              <td className="font-mono text-xs">
                {r.published ? (
                  <a href={`${SITE_URL}/site/${s(r.slug)}`} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                    {s(r.slug)}
                  </a>
                ) : (
                  s(r.slug)
                )}
              </td>
              <td>{r.published ? <When iso={s(r.published_at) || null} /> : muted("No")}</td>
              <td>
                <Badge tone={statusTone(s(r.moderation_status))}>{s(r.moderation_status)}</Badge>
              </td>
              <td>
                <When iso={s(r.created_at)} />
              </td>
              <td>
                <When iso={s(r.updated_at)} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  if (tab === "activity") {
    return (
      <Table>
        <thead>
          <tr>
            <th>When</th>
            <th>Kind</th>
            <th>Input</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={s(r.id)}>
              <td>
                <When iso={s(r.created_at)} />
              </td>
              <td>
                <Badge>{s(r.kind)}</Badge>
              </td>
              <td className="font-mono text-xs break-all text-muted-foreground">{preview(r.input)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  if (tab === "domains") {
    return (
      <Table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Topic</th>
            <th>Status</th>
            <th>Saved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={s(r.domain)}>
              <td className="font-medium">{s(r.domain)}</td>
              <td>{s(r.topic) || muted()}</td>
              <td>
                <Badge>{s(r.status)}</Badge>
              </td>
              <td>
                <When iso={s(r.created_at)} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  // audit
  return (
    <Table>
      <thead>
        <tr>
          <th>When</th>
          <th>Admin</th>
          <th>Action</th>
          <th>Details</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={s(r.id)}>
            <td>
              <When iso={s(r.created_at)} />
            </td>
            <td>
              <div className="flex flex-col gap-0.5">
                <MaskedAddress value={s(r.admin_account)} link={false} />
                <span className="text-xs text-muted-foreground">{s(r.role)}</span>
              </div>
            </td>
            <td>
              <span className="font-mono text-xs">{s(r.action)}</span> {r.signature ? <Badge tone="good">signed</Badge> : null}
            </td>
            <td className="font-mono text-xs break-all text-muted-foreground">{preview(r.params)}</td>
            <td className="break-words">{s(r.reason)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
