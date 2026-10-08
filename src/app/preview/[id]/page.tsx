import type { Metadata } from "next"
import { LocalPreview } from "@/components/site/local-preview"
import { WalletGate } from "@/components/app/wallet-gate"
import { getSession } from "@/lib/auth/session"
import { maintenanceFor } from "@/lib/settings"
import { MaintenanceScreen } from "@/components/maintenance/maintenance-screen"

export const metadata: Metadata = { title: "Website Preview", robots: { index: false, follow: false } }

export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  const [{ id }, session] = await Promise.all([params, getSession()])
  const maintenance = await maintenanceFor(session?.accountId)
  if (maintenance) return <MaintenanceScreen message={maintenance} />
  return (
    <WalletGate initialSignedIn={Boolean(session)}>
      <LocalPreview id={id} />
    </WalletGate>
  )
}
