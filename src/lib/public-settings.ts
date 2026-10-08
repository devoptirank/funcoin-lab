import { useEffect, useState } from "react"
import { CREDIT_PACKS, IMAGE_COSTS, WELCOME_CREDITS, type CreditPack } from "@/lib/billing/plans"

/**
 * The runtime settings the browser may see (served by /api/settings/public). No secrets: pricing,
 * feature switches, the active announcement and social links. Client components read them with
 * usePublicSettings(), which starts from the code defaults so nothing flashes or breaks if the
 * request fails.
 */

export type ImageCosts = { logo: number; mascot: number; meme: number; banner: number; "site-hero": number }
export type PublicFeatures = {
  images: boolean
  signIns: boolean
  checkoutSol: boolean
  checkoutUsdc: boolean
  checkoutNowpayments: boolean
  publishing: boolean
  domainSearch: boolean
  waitlist: boolean
  tools: { concept: boolean; logo: boolean; memes: boolean; social: boolean; content: boolean; domains: boolean }
}
export type PublicAnnouncement = { text: string; link: string; tone: "info" | "warning"; target: "site" | "app" | "both"; start: string; end: string }
export type PublicSocial = { id: "x" | "telegram" | "discord" | "github" | "instagram" | "tiktok" | "youtube"; label: string; url: string }

export type PublicSettings = {
  pricing: { packs: CreditPack[]; imageCosts: ImageCosts; welcomeCredits: number }
  features: PublicFeatures
  announcement: PublicAnnouncement | null
  socials: PublicSocial[]
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  pricing: { packs: CREDIT_PACKS, imageCosts: { ...IMAGE_COSTS }, welcomeCredits: WELCOME_CREDITS },
  features: {
    images: true,
    signIns: true,
    checkoutSol: true,
    checkoutUsdc: true,
    checkoutNowpayments: true,
    publishing: true,
    domainSearch: true,
    waitlist: true,
    tools: { concept: true, logo: true, memes: true, social: true, content: true, domains: true },
  },
  announcement: null,
  socials: [],
}

let cached: PublicSettings | null = null
let inflight: Promise<PublicSettings> | null = null

/** One request per page load, shared by every component that asks. */
export function loadPublicSettings(): Promise<PublicSettings> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetch("/api/settings/public")
      .then((r) => (r.ok ? (r.json() as Promise<Partial<PublicSettings>>) : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        cached = {
          pricing: { ...DEFAULT_PUBLIC_SETTINGS.pricing, ...j.pricing },
          features: { ...DEFAULT_PUBLIC_SETTINGS.features, ...j.features, tools: { ...DEFAULT_PUBLIC_SETTINGS.features.tools, ...j.features?.tools } },
          announcement: j.announcement ?? null,
          socials: Array.isArray(j.socials) ? j.socials : [],
        }
        return cached
      })
      .catch(() => {
        // Retry on the next mount; until then the defaults apply.
        inflight = null
        return DEFAULT_PUBLIC_SETTINGS
      })
  }
  return inflight
}

/** Public settings for client components. Returns the code defaults until the request resolves. */
export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(() => cached ?? DEFAULT_PUBLIC_SETTINGS)
  useEffect(() => {
    let alive = true
    void loadPublicSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])
  return settings
}
