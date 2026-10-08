import type { Metadata } from "next"
import { CircleAlert, Lock } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getSetting, type SettingKey } from "@/lib/settings"
import { AdminHeader, Badge, Panel, When } from "@/components/admin/ui"
import { MaskedAddress } from "@/components/admin/masked-address"
import { AnnouncementForm, FeaturesForm, LimitsForm, MaintenanceForm, PricingForm, SocialsForm } from "@/components/admin/settings/forms"

export const metadata: Metadata = { title: "Settings" }

type RowMeta = { updated_by: string | null; updated_at: string | null }

/** Who last saved each setting, so admins can see whether a value is a saved one or the code default. */
async function savedMeta(): Promise<Record<string, RowMeta> | null> {
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const { data, error } = await sb.from("site_settings").select("key, updated_by, updated_at")
  if (error || !data) return null
  return Object.fromEntries(data.map((r: { key: string } & RowMeta) => [r.key, { updated_by: r.updated_by, updated_at: r.updated_at }]))
}

function Meta({ meta, k }: { meta: Record<string, RowMeta> | null; k: SettingKey }) {
  const row = meta?.[k]
  if (!row) return <Badge>Code default</Badge>
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Badge tone="good">Saved</Badge>
      {row.updated_at && <When iso={row.updated_at} />}
      {row.updated_by && <MaskedAddress value={row.updated_by} link={false} />}
    </span>
  )
}

const validBase58 = (v: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)

function EnvAddress({ label, value, note }: { label: string; value: string; note: string }) {
  const v = value.trim()
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden /> {label}
      </p>
      {v ? (
        <p className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-xs break-all">{v}</code>
          {validBase58(v) ? <MaskedAddress value={v} /> : <Badge tone="bad">Not a valid address</Badge>}
        </p>
      ) : (
        <p className="text-sm">Not set</p>
      )}
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export default async function AdminSettingsPage() {
  const admin = await requireAdmin("admin.view")
  const canWrite = can(admin.role, "settings.write")
  const supabase = Boolean(getSupabaseAdmin())
  const [pricing, features, limits, maintenance, announcement, socials, meta] = await Promise.all([
    getSetting("pricing"),
    getSetting("features"),
    getSetting("limits"),
    getSetting("maintenance"),
    getSetting("announcement"),
    getSetting("socials"),
    savedMeta(),
  ])
  const writable = canWrite && supabase

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminHeader title="Settings" description="Runtime settings, live without a redeploy. Every save needs a reason and is written to the audit log." />

      {!supabase && (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Supabase isn&apos;t connected on this deployment, so settings are read-only and the code defaults are in use.
        </p>
      )}
      {maintenance.enabled && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          Maintenance mode is ON. The app is showing the maintenance page to everyone except admins.
        </p>
      )}

      <Panel title="Pricing" actions={<Meta meta={meta} k="pricing" />}>
        <PricingForm initial={pricing} canWrite={writable} />
      </Panel>

      <Panel title="Feature switches" actions={<Meta meta={meta} k="features" />}>
        <FeaturesForm initial={features} canWrite={writable} />
      </Panel>

      <Panel title="Limits" actions={<Meta meta={meta} k="limits" />}>
        <LimitsForm initial={limits} canWrite={writable} />
      </Panel>

      <Panel title="Maintenance mode" actions={<Meta meta={meta} k="maintenance" />}>
        <MaintenanceForm initial={maintenance} canWrite={writable} />
      </Panel>

      <Panel title="Announcement banner" actions={<Meta meta={meta} k="announcement" />}>
        <AnnouncementForm initial={announcement} canWrite={writable} />
      </Panel>

      <Panel title="Social links" actions={<Meta meta={meta} k="socials" />}>
        <SocialsForm initial={socials} canWrite={writable} />
      </Panel>

      <Panel title="Addresses (env only)">
        <div className="grid gap-3 sm:grid-cols-2">
          <EnvAddress
            label="Token contract address (NEXT_PUBLIC_TOKEN_CA)"
            value={process.env.NEXT_PUBLIC_TOKEN_CA ?? ""}
            note="Shown on the site as the only official contract address."
          />
          <EnvAddress label="Merchant wallet (MERCHANT_SOLANA_ADDRESS)" value={process.env.MERCHANT_SOLANA_ADDRESS ?? ""} note="Receives SOL and USDC payments." />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          These can&apos;t be changed here on purpose: a hijacked admin session must never be able to swap the address people buy or pay. Changing either one means updating the
          environment variable in Vercel and redeploying.
        </p>
      </Panel>
    </div>
  )
}
