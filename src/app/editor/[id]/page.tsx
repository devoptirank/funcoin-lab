import type { Metadata } from "next"
import { SiteEditor } from "@/components/editor/site-editor"
import { WalletGate } from "@/components/app/wallet-gate"
import { getSession } from "@/lib/auth/session"
import { maintenanceFor } from "@/lib/settings"
import { MaintenanceScreen } from "@/components/maintenance/maintenance-screen"

export const metadata: Metadata = { title: "Website Editor", robots: { index: false, follow: false } }

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const [{ id }, session] = await Promise.all([params, getSession()])
  const maintenance = await maintenanceFor(session?.accountId)
  if (maintenance) return <MaintenanceScreen message={maintenance} />
  return (
    <WalletGate initialSignedIn={Boolean(session)}>
      <SiteEditor projectId={id} />
    </WalletGate>
  )
}
