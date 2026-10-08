import type { Metadata } from "next"
import { UserPlus } from "lucide-react"
import { envOwners, requireAdmin } from "@/lib/admin/guard"
import { ADMIN_ROLES } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { AdminHeader, Badge, Empty, Panel, Table, When } from "@/components/admin/ui"
import { AdminAction } from "@/components/admin/admin-action"
import { MaskedAddress } from "@/components/admin/masked-address"
import { NoDatabase, QueryError } from "@/components/admin/ops/kpi"

export const metadata: Metadata = { title: "Admins" }

type AdminRow = { account_id: string; role: string; added_by: string | null; created_at: string; disabled_at: string | null }

const ROLE_OPTIONS = ADMIN_ROLES.map((r) => ({ value: r, label: r }))
const ROLE_HELP = "owner: everything, including admins. admin: users, billing, moderation, settings. support: read all, small credit grants, unpublish. viewer: read-only."

export default async function TeamPage() {
  const me = await requireAdmin("admins.manage")
  const owners = [...envOwners()]
  const sb = getSupabaseAdmin()
  const result = sb ? await sb.from("admin_users").select("account_id, role, added_by, created_at, disabled_at").order("created_at", { ascending: false }).limit(500) : null
  const rows = ((result?.data ?? []) as AdminRow[]).filter((r) => !owners.includes(r.account_id))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminHeader
        title="Admins"
        description="Who can use this panel. Every change needs a reason and a wallet signature, and takes effect on the admin's next request."
        actions={
          sb ? (
            <AdminAction
              label={
                <>
                  <UserPlus aria-hidden /> Add admin
                </>
              }
              variant="glow"
              endpoint="/api/admin/team"
              title="Add an admin"
              description={`The wallet gets the chosen role right away (a disabled admin is re-enabled). ${ROLE_HELP}`}
              fields={[
                { name: "address", label: "Solana wallet address", type: "text", placeholder: "Base58 address", maxLength: 48 },
                { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS, defaultValue: "viewer" },
              ]}
              confirmLabel="Add admin"
            />
          ) : undefined
        }
      />

      {!sb && <NoDatabase />}

      <Panel title="Owners from ADMIN_WALLETS">
        {owners.length === 0 ? (
          <Empty>ADMIN_WALLETS is empty.</Empty>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {owners.map((o) => (
              <li key={o} className="flex flex-wrap items-center gap-2">
                <MaskedAddress value={o} />
                <Badge tone="good">owner</Badge>
                {o === me.account && <Badge>you</Badge>}
                <span className="text-xs text-muted-foreground">ADMIN_WALLETS, can&apos;t be changed here</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {sb && (
        <Panel title="Admins added in the panel">
          {result?.error ? (
            <QueryError message={result.error.message} />
          ) : rows.length === 0 ? (
            <Empty>No admins added yet. Use Add admin to invite a wallet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th scope="col">Wallet</th>
                  <th scope="col">Role</th>
                  <th scope="col">Added by</th>
                  <th scope="col">Added</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const self = r.account_id === me.account
                  return (
                    <tr key={r.account_id}>
                      <td>
                        <MaskedAddress value={r.account_id} />
                        {self && (
                          <span className="ml-1">
                            <Badge>you</Badge>
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge tone={r.disabled_at ? "neutral" : "good"}>{r.role}</Badge>
                      </td>
                      <td>{r.added_by ? <MaskedAddress value={r.added_by} link={false} /> : <span className="text-muted-foreground">-</span>}</td>
                      <td>
                        <When iso={r.created_at} />
                      </td>
                      <td>
                        {r.disabled_at ? (
                          <span className="flex flex-col gap-0.5">
                            <Badge tone="bad">disabled</Badge>
                            <span className="text-xs text-muted-foreground">
                              <When iso={r.disabled_at} />
                            </span>
                          </span>
                        ) : (
                          <Badge tone="good">active</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        {!self && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <AdminAction
                              label={r.disabled_at ? "Re-enable" : "Change role"}
                              size="xs"
                              endpoint="/api/admin/team"
                              payload={{ address: r.account_id }}
                              title={r.disabled_at ? "Re-enable admin" : "Change role"}
                              description={`${r.disabled_at ? "Re-enables" : "Changes the role of"} ${r.account_id.replace(/^sol:/, "").slice(0, 4)}...${r.account_id.slice(-4)}. ${ROLE_HELP}`}
                              fields={[{ name: "role", label: "Role", type: "select", options: ROLE_OPTIONS, defaultValue: r.role }]}
                              confirmLabel="Save role"
                            />
                            {!r.disabled_at && (
                              <AdminAction
                                label="Disable"
                                size="xs"
                                destructive
                                endpoint="/api/admin/team/disable"
                                payload={{ account: r.account_id }}
                                title="Disable admin"
                                description={`${r.account_id.replace(/^sol:/, "").slice(0, 4)}...${r.account_id.slice(-4)} loses admin access on their next request. You can re-enable them later.`}
                                confirmLabel="Disable admin"
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      )}
    </div>
  )
}
