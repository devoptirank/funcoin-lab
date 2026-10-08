import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getAdminState } from "@/lib/admin/guard"
import { isAdminHost } from "@/lib/hosts"
import { AdminGate } from "@/components/admin/admin-gate"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

/**
 * Chrome for the admin panel. This layout is NOT the security boundary: every page and admin API
 * calls requireAdmin itself. Here we only pick which screen to show.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getAdminState()
  if (s.state === "not-admin") notFound()
  if (s.state === "anonymous") return <AdminGate mode="connect" />
  if (s.state === "needs-step-up") return <AdminGate mode="step-up" address={s.address} />
  const host = (await headers()).get("host") ?? ""
  const env = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "local"
  return (
    <AdminShell base={isAdminHost(host) ? "" : "/admin"} address={s.ctx.address} role={s.ctx.role} env={env} cluster={process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet-beta"}>
      {children}
    </AdminShell>
  )
}
