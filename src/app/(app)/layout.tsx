import type { Metadata } from "next"
import { Navbar } from "@/components/layout/navbar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { WalletGate } from "@/components/app/wallet-gate"
import { getSession } from "@/lib/auth/session"
import { maintenanceFor } from "@/lib/settings"
import { AnnouncementBanner } from "@/components/layout/announcement-banner"
import { MaintenanceScreen } from "@/components/maintenance/maintenance-screen"
import { TokenTicker } from "@/components/token/token-ticker"
import { TOKEN } from "@/lib/official"
import { SITE_URL, SPLIT_HOSTS } from "@/lib/hosts"

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | FunCoin Lab" }, robots: { index: false, follow: false } }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  // Maintenance mode (admin Settings): everyone except admins sees the maintenance page.
  const maintenance = await maintenanceFor(session?.accountId)
  if (maintenance) return <MaintenanceScreen message={maintenance} />
  return (
    <div className="min-h-dvh">
      {TOKEN.live && <TokenTicker ticker={TOKEN.ticker} ca={TOKEN.ca} href={SPLIT_HOSTS ? `${SITE_URL}/token` : "/token"} />}
      <AnnouncementBanner surface="app" />
      <Navbar variant="app" />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-10">
        <DashboardSidebar />
        <main id="main" className="min-w-0 flex-1">
          <WalletGate initialSignedIn={Boolean(session)}>{children}</WalletGate>
        </main>
      </div>
    </div>
  )
}
