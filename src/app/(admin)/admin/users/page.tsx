import type { Metadata } from "next"
import Link from "next/link"
import { Download } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { adminDb, pageOf } from "@/lib/admin/api"
import { adminBase } from "@/lib/admin/base"
import { can } from "@/lib/admin/permissions"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { AdminHeader, Badge, Empty, Filters, Pager, Panel, Table, When, statusTone, usd } from "@/components/admin/ui"
import { Notice, readError } from "@/components/admin/users/notice"
import { filterParams, listAccounts, parseUserFilters, withAggregates, type UserSummary } from "@/components/admin/users/users-query"

export const metadata: Metadata = { title: "Users" }

const PAGE_SIZE = 25

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("users.read")
  const sp = await searchParams
  const base = await adminBase()
  const { filters, invalidSearch } = parseUserFilters(sp)
  const { page, from, to } = pageOf(sp, PAGE_SIZE)
  const params = filterParams(filters)

  let users: UserSummary[] = []
  let hasMore = false
  let truncated = false
  let error: string | null = null
  try {
    const sb = adminDb()
    // One extra row tells us whether there is a next page.
    const rows = await listAccounts(sb, filters, from, to + 1)
    hasMore = rows.length > PAGE_SIZE
    const result = await withAggregates(sb, rows.slice(0, PAGE_SIZE))
    users = result.users
    truncated = result.truncated
  } catch (e) {
    error = readError(e)
  }

  const listHref = adminHref(base, "/users")
  const exportHref = `/api/admin/users/export?${new URLSearchParams(params).toString()}`

  return (
    <div className="mx-auto flex max-w-6xl flex-col">
      <AdminHeader
        title="Users"
        description="Every wallet with a FunCoin Lab account. Search by full or partial address."
        actions={
          can(admin.role, "export.csv") && !error ? (
            <a href={exportHref} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-foreground/5">
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          ) : undefined
        }
      />

      {error && <Notice>{error}</Notice>}
      {invalidSearch && <Notice>The search only matches wallet address characters (base58). The search was ignored.</Notice>}

      <Filters action={listHref}>
        <label>
          Wallet address
          <input name="q" defaultValue={filters.q} placeholder="7xK or full address" className="w-56" autoComplete="off" spellCheck={false} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </label>
        <label>
          Has paid
          <select name="paid" defaultValue={filters.paid}>
            <option value="">Any</option>
            <option value="yes">Paid at least once</option>
            <option value="no">Never paid</option>
          </select>
        </label>
        <label>
          Created from
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label>
          Created to
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="seen">Last seen</option>
          </select>
        </label>
        {Object.keys(params).length > 0 && (
          <Link href={listHref} className="h-9 rounded-lg px-3 leading-9 text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </Filters>

      <Panel>
        {truncated && <p className="mb-3 text-xs text-muted-foreground">Some accounts have very long histories, so balances or paid totals on this page may be partial.</p>}
        {!error && users.length === 0 ? (
          <Empty>{Object.keys(params).length ? "No wallets match these filters." : "No wallets yet."}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Status</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Projects</th>
                <th className="text-right">Paid</th>
                <th>Created</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={adminHref(base, `/users/${encodeURIComponent(u.id)}`)} className="font-medium underline-offset-2 hover:underline">
                        View
                      </Link>
                      <MaskedAddress value={u.id} />
                    </div>
                  </td>
                  <td>
                    <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                  </td>
                  <td className="text-right tabular-nums">{u.balance.toLocaleString("en-US")}</td>
                  <td className="text-right tabular-nums">{u.projectCount}</td>
                  <td className="text-right tabular-nums">{u.paidUsd > 0 ? usd(u.paidUsd) : <span className="text-muted-foreground">-</span>}</td>
                  <td>
                    <When iso={u.created_at} />
                  </td>
                  <td>
                    <When iso={u.last_seen_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {!error && <Pager base={listHref} params={params} page={page} hasMore={hasMore} />}
      </Panel>
    </div>
  )
}
