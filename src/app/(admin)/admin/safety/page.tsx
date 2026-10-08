import type { Metadata } from "next"
import { Lock } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { can } from "@/lib/admin/permissions"
import { BUILT_IN_BLOCKED_TERMS, SAFETY_REPLACEMENTS } from "@/lib/safety"
import { getSetting } from "@/lib/settings"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { AdminAction } from "@/components/admin/admin-action"
import { AdminHeader, Badge, Empty, Panel, Table } from "@/components/admin/ui"
import { SafetyTester } from "@/components/admin/content/safety-tester"

export const metadata: Metadata = { title: "Safety" }

export default async function SafetyPage() {
  const admin = await requireAdmin("content.read")
  const canWrite = can(admin.role, "safety.write")
  const supabase = Boolean(getSupabaseAdmin())
  const { extraTerms } = await getSetting("safety")

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <AdminHeader
        title="Safety"
        description="The filter applied to topics and generated copy. Built-in rules are the floor; admin-added terms are merged on top."
      />

      <Panel
        title={`Admin-added blocked terms (${extraTerms.length})`}
        actions={
          canWrite && supabase ? (
            <AdminAction
              label="Add term"
              endpoint="/api/admin/safety/terms"
              payload={{ action: "add" }}
              fields={[{ name: "term", label: "Term", type: "text", placeholder: "for example: rug pull", maxLength: 40 }]}
              title="Add a blocked term"
              description="Topics containing this term (as a whole word or phrase) are refused by the idea, domain and image generators. Use lowercase letters, digits, spaces and hyphens, 2 to 40 characters."
              confirmLabel="Add term"
              variant="glow"
            />
          ) : undefined
        }
      >
        {!supabase && <p className="mb-3 text-sm text-muted-foreground">Supabase isn&apos;t connected, so only the built-in rules apply and terms can&apos;t be added.</p>}
        {extraTerms.length === 0 ? (
          <Empty>No admin-added terms yet. The built-in list below still applies.</Empty>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {extraTerms.map((term) => (
              <li key={term} className="flex items-center gap-1 rounded-lg border border-border py-0.5 pr-0.5 pl-2 font-mono text-xs">
                {term}
                {canWrite && (
                  <AdminAction
                    label="Remove"
                    endpoint="/api/admin/safety/terms"
                    payload={{ action: "remove", term }}
                    title={`Remove "${term}"`}
                    description={`Topics containing "${term}" will no longer be refused (unless a built-in term matches).`}
                    confirmLabel="Remove term"
                    variant="ghost"
                    size="xs"
                    destructive
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Test a phrase">
        <p className="mb-3 text-sm text-muted-foreground">Runs the phrase through sanitizeText and the topic check (built-in plus admin-added terms). Nothing is saved.</p>
        <SafetyTester />
      </Panel>

      <Panel title={`Built-in blocked topics (${BUILT_IN_BLOCKED_TERMS.length})`} actions={<Badge><Lock className="mr-1 inline size-3" aria-hidden />Read only</Badge>}>
        <p className="mb-3 text-sm text-muted-foreground">Defined in code (src/lib/safety.ts). They always apply and can&apos;t be removed here.</p>
        <ul className="flex flex-wrap gap-2">
          {BUILT_IN_BLOCKED_TERMS.map((t) => (
            <li key={t} className="rounded-lg bg-foreground/[0.06] px-2 py-0.5 font-mono text-xs">
              {t}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={`Built-in rewrites (${SAFETY_REPLACEMENTS.length})`} actions={<Badge><Lock className="mr-1 inline size-3" aria-hidden />Read only</Badge>}>
        <p className="mb-3 text-sm text-muted-foreground">Financial-promise wording in generated copy is rewritten before it reaches the page. Links and wallet addresses are left untouched.</p>
        <Table>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Replaced with</th>
            </tr>
          </thead>
          <tbody>
            {SAFETY_REPLACEMENTS.map((r) => (
              <tr key={r.pattern}>
                <td className="font-mono text-xs break-all">
                  /{r.pattern}/{r.flags}
                </td>
                <td>{r.replacement}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  )
}
