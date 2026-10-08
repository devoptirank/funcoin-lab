import { siDiscord, siGithub, siInstagram, siTelegram, siTiktok, siX, siYoutube, type SimpleIcon } from "simple-icons"
import type { Social, SocialId } from "@/lib/official"
import { cn } from "@/lib/utils"

const ICONS: Record<SocialId, SimpleIcon> = { x: siX, telegram: siTelegram, discord: siDiscord, github: siGithub, instagram: siInstagram, tiktok: siTiktok, youtube: siYoutube }

/** Brand mark from Simple Icons, drawn in the current text color. */
export function BrandIcon({ id, className }: { id: SocialId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 fill-current", className)}>
      <path d={ICONS[id].path} />
    </svg>
  )
}

/** The official FunCoin Lab social accounts. Pass the list from getSocials() (server). */
export function SocialLinks({ socials, className, size = "md" }: { socials: Social[]; className?: string; size?: "md" | "lg" }) {
  if (!socials.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="FunCoin Lab on social media">
      {socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={s.label}
            title={s.label}
            className={cn(
              "grid place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-lab-fill/60 hover:text-foreground",
              size === "lg" ? "size-12" : "size-9",
            )}
          >
            <BrandIcon id={s.id} className={size === "lg" ? "size-5" : "size-4"} />
          </a>
        </li>
      ))}
    </ul>
  )
}
