import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { AnnouncementBanner } from "@/components/layout/announcement-banner"
import { TokenTicker } from "@/components/token/token-ticker"
import { TOKEN } from "@/lib/official"
import { AnalyticsConsent } from "@/components/consent/analytics-consent"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2">
        Skip to content
      </a>
      {TOKEN.live && <TokenTicker ticker={TOKEN.ticker} ca={TOKEN.ca} href="/token" />}
      <AnnouncementBanner surface="site" />
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <AnalyticsConsent />
    </div>
  )
}
