import type { Metadata } from "next"
import Link from "next/link"
import { requireAdmin } from "@/lib/admin/guard"
import { adminBase } from "@/lib/admin/base"
import { pageOf, str } from "@/lib/admin/api"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { AdminHeader, Badge, Empty, Filters, Pager, Panel, Table, When } from "@/components/admin/ui"
import { MaskedAddress } from "@/components/admin/masked-address"
import { ExportLink, NoDatabase, QueryError } from "@/components/admin/ops/kpi"
import { auditFilters, auditQuery, filterParams, type AuditRow } from "@/components/admin/ops/audit-query"

export const metadata: Metadata = { title: "Audit log" }

const TARGET_TYPES = ["account", "order", "project", "asset", "report", "setting", "admin", "waitlist", "domain_clicks"]

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("audit.read")
  const sp = await searchParams
  const base = await adminBase()
  const f = auditFilters((k) => str(sp[k]))
  const params = filterParams(f)
  const { page, size, from, to } = pageOf(sp, 50)
  const sb = getSupabaseAdmin()

  const result = sb ? await auditQuery(sb, f).range(from, to + 1) : null
  const rows = (result?.data ?? []) as unknown as AuditRow[]
  const hasMore = rows.length > size
  const exportHref = `/api/admin/audit/export?${new URLSearchParams(params)}`
  const filtered = Object.keys(params).length > 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AdminHeader
        title="Audit log"
        description="Every admin action and export, newest first. Append-only: nothing here can be edited or deleted."
        actions={sb && can(admin.role, "export.csv") ? <ExportLink href={exportHref} /> : undefined}
      />

      <Filters action={adminHref(base, "/audit")}>
        <label>
          Admin wallet
          <input name="admin" defaultValue={f.admin} placeholder="Part of an address" className="w-40" />
        </label>
        <label>
          Action
          <input name="action" defaultValue={f.action} placeholder="e.g. credits." className="w-36" list="audit-actions" />
          <datalist id="audit-actions">
            {["credits.", "account.", "order.", "project.", "asset.", "report.", "setting.", "admin.", "export.csv", "auth."].map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>
        <label>
          Target type
          <select name="target_type" defaultValue={f.targetType}>
            <option value="">Any</option>
            {[...new Set([...TARGET_TYPES, ...(f.targetType ? [f.targetType] : [])])].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Target id
          <input name="target_id" defaultValue={f.targetId} placeholder="Part of an id" className="w-40" />
        </label>
        <label>
          From
          <input type="date" name="from" defaultValue={f.from} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={f.to} />
        </label>
        {filtered && (
          <Link href={adminHref(base, "/audit")} className="h-9 content-center px-2 text-sm text-muted-foreground underline-offset-2 hover:underline">
            Clear
          </Link>
        )}
      </Filters>

      {!sb && <NoDatabase />}
      {result?.error && <QueryError message={result.error.message} />}

      {sb && !result?.error && (
        <Panel>
          {rows.length === 0 ? (
            <Empty>{page > 1 ? "No more entries." : filtered ? "No audit entries match these filters." : "No admin actions recorded yet."}</Empty>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Admin</th>
                    <th scope="col">Action</th>
                    <th scope="col">Target</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, size).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <When iso={r.created_at} />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <MaskedAddress value={r.admin_account} link={false} />
                          <Badge>{r.role}</Badge>
                        </div>
                      </td>
                      <td className="font-mono text-xs">
                        {r.action}
                        {r.signature && (
                          <span className="mt-1 block">
                            <Badge tone="good">Wallet signed</Badge>
                          </span>
                        )}
                      </td>
                      <td className="text-xs">
                        {r.target_type ? <span className="text-muted-foreground">{r.target_type}</span> : "-"}
                        {r.target_id && (
                          <span className="block font-mono break-all">
                            {r.target_type === "account" && r.target_id.startsWith("sol:") ? (
                              <Link href={adminHref(base, "/users/" + encodeURIComponent(r.target_id))} className="underline-offset-2 hover:underline">
                                {r.target_id.length > 20 ? `${r.target_id.slice(0, 10)}…${r.target_id.slice(-4)}` : r.target_id}
                              </Link>
                            ) : (
                              r.target_id
                            )}
                          </span>
                        )}
                      </td>
                      <td className="max-w-56 text-xs break-words">{r.reason}</td>
                      <td className="text-xs">
                        <details>
                          <summary className="cursor-pointer text-muted-foreground">Show</summary>
                          <dl className="mt-2 grid gap-1">
                            <dt className="text-muted-foreground">Params</dt>
                            <dd>
                              <pre className="max-h-60 max-w-80 overflow-auto rounded bg-foreground/[0.05] p-2 text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(r.params ?? {}, null, 2)}</pre>
                            </dd>
                            <dt className="text-muted-foreground">IP</dt>
                            <dd className="font-mono">{r.ip || "-"}</dd>
                            <dt className="text-muted-foreground">User agent</dt>
                            <dd className="max-w-80 break-words">{r.user_agent || "-"}</dd>
                          </dl>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pager base={adminHref(base, "/audit")} params={params} page={page} hasMore={hasMore} />
            </>
          )}
        </Panel>
      )}
    </div>
  )
}
