import { ArrowUpRight, Info, TriangleAlert } from "lucide-react"
import { announcementActive, getSetting, type SettingValue } from "@/lib/settings"
import { AnnouncementDismiss } from "@/components/maintenance/announcement-dismiss"
import { cn } from "@/lib/utils"

const TONES = {
  info: "border-b border-lab-fill/40 bg-[color-mix(in_oklab,var(--lab)_16%,var(--background))] text-foreground",
  warning: "border-b border-amber-500/40 bg-amber-500/15 text-foreground",
} as const

/**
 * The site-wide announcement from admin Settings, shown on the marketing site, the app or both,
 * between its start and end times. Renders nothing when there is none or settings can't be read.
 */
export async function AnnouncementBanner({ surface }: { surface: "site" | "app" }) {
  let a: SettingValue<"announcement">
  try {
    a = await getSetting("announcement")
  } catch {
    return null
  }
  if (a.target !== "both" && a.target !== surface) return null
  if (!announcementActive(a)) return null
  const Icon = a.tone === "warning" ? TriangleAlert : Info

  return (
    <AnnouncementDismiss id={`${a.text}|${a.link}`} end={a.end} className={cn(TONES[a.tone])}>
      <p className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 size-4 shrink-0", a.tone === "warning" ? "text-amber-600 dark:text-amber-400" : "text-lab")} aria-hidden />
        <span>
          {a.text}
          {a.link && (
            <>
              {" "}
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-4">
                Learn more <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </>
          )}
        </span>
      </p>
    </AnnouncementDismiss>
  )
}
