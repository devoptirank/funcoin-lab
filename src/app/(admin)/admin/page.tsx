import type { Metadata } from "next"
import { CircleAlert, CircleCheck } from "lucide-react"
import { requireAdmin } from "@/lib/admin/guard"
import { PERMISSIONS, can, type Permission } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const metadata: Metadata = { title: "Overview" }

/** Whether migration 0006 has been applied (admin tables exist). */
async function adminSchemaReady(): Promise<boolean | null> {
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const { error } = await sb.from("admin_audit").select("id", { head: true, count: "exact" }).limit(1)
  return !error
}

export default async function AdminOverview() {
  const admin = await requireAdmin("admin.view")
  const supabase = Boolean(getSupabaseAdmin())
  const schema = await adminSchemaReady()
  const perms = (Object.keys(PERMISSIONS) as Permission[]).filter((p) => can(admin.role, p))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Signed in as {admin.role}. KPIs and charts arrive in the Operations milestone.</p>
      </div>

      {!supabase && (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Supabase isn&apos;t connected on this deployment, so the admin panel is read-only and most data is unavailable.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Database", ok: supabase, text: supabase ? "Connected" : "Not connected" },
          { label: "Admin tables (0006)", ok: schema === true, text: schema === null ? "Unknown" : schema ? "Ready" : "Run migration 0006" },
          { label: "Your role", ok: true, text: admin.role },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold">
              {t.ok ? <CircleCheck className="size-4 text-lab" aria-hidden /> : <CircleAlert className="size-4 text-destructive" aria-hidden />} {t.text}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Your permissions</h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {perms.map((p) => (
            <li key={p} className="rounded bg-foreground/[0.06] px-2 py-0.5 font-mono text-xs">{p}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
