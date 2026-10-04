import type { Metadata } from "next"
import { Navbar } from "@/components/layout/navbar"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { GuestBanner } from "@/components/dashboard/guest-banner"

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-10">
        <DashboardSidebar />
        <main id="main" className="min-w-0 flex-1">
          <GuestBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
