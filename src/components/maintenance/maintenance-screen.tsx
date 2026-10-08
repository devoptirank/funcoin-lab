import { Wrench } from "lucide-react"
import { SITE_URL } from "@/lib/hosts"

/**
 * Full-page notice the app host shows while maintenance mode is on (admin Settings). Admins never
 * see it. The marketing site and the admin panel stay up, so we link back to the site.
 */
export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- brand coin artwork */}
        <img src="/coins/funcoinlab.webp" alt="" width={72} height={72} className="size-18" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Wrench className="size-3.5" aria-hidden /> Maintenance
        </span>
        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">We&apos;ll be right back</h1>
        <p className="text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">Your projects, websites and credits are safe and will be here when we&apos;re back.</p>
        <a href={SITE_URL || "/"} className="rounded-full bg-lab-fill px-5 py-2.5 text-sm font-semibold text-lab-ink">
          Back to FunCoin Lab
        </a>
      </div>
    </main>
  )
}
