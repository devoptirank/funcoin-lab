// Shared domain types for FunCoin Lab.
// Brand concepts, websites and assets for meme brands. Generated copy never makes financial promises.

export const THEMES = [
  { id: "animals", label: "Animals", art: "cat" },
  { id: "food", label: "Food", art: "pizza" },
  { id: "ai", label: "AI", art: "robot" },
  { id: "internet", label: "Internet memes", art: "npc" },
  { id: "gaming", label: "Gaming", art: "controller" },
  { id: "space", label: "Space", art: "alien" },
  { id: "culture", label: "Politics-free culture", art: "office" },
  { id: "indian", label: "Indian memes", art: "chai" },
  { id: "desi", label: "Desi culture", art: "samosa" },
  { id: "random", label: "Random", art: "lab" },
  { id: "custom", label: "Custom" },
] as const

export const PERSONALITIES = [
  { id: "cute", label: "Cute" },
  { id: "chaotic", label: "Chaotic" },
  { id: "absurd", label: "Absurd" },
  { id: "funny", label: "Funny" },
  { id: "luxury", label: "Luxury" },
  { id: "genz", label: "Gen-Z" },
  { id: "weird", label: "Weird" },
  { id: "aggressive", label: "Aggressive" },
  { id: "wholesome", label: "Wholesome" },
  { id: "random", label: "Completely Random" },
] as const

export const NAMING_STYLES = [
  { id: "short", label: "Short", example: "$SNOOZ" },
  { id: "oneword", label: "One-word", example: "Purrlo" },
  { id: "slang", label: "Slang", example: "CatChad" },
  { id: "phrase", label: "Meme phrase", example: "No Thoughts Just Cat" },
  { id: "character", label: "Character name", example: "Sir Whiskerton" },
  { id: "brand", label: "Fake brand", example: "Catcorp Industries" },
  { id: "internet", label: "Internet-style", example: "cat.exe" },
] as const

export type ThemeId = (typeof THEMES)[number]["id"]
export type PersonalityId = (typeof PERSONALITIES)[number]["id"]
export type NamingStyleId = (typeof NAMING_STYLES)[number]["id"]

export type ConceptInput = {
  topic: string
  theme: ThemeId
  personality: PersonalityId
  namingStyle: NamingStyleId
  seed?: number
}

export type PaletteColor = { name: string; hex: string }
export type LoreStep = { title: string; text: string }

export type MemeConcept = {
  id: string
  createdAt: string
  input: ConceptInput
  source: "ai" | "local"
  /** 1. Meme coin name */
  name: string
  /** 2. Ticker concept, without the $ */
  ticker: string
  /** 3. .fun domain idea */
  domain: string
  /** 4. One-line description */
  tagline: string
  /** 5. Meme personality traits */
  traits: string[]
  /** 6. Origin story */
  originStory: string
  /** 7. Community slogan */
  slogan: string
  /** 8. Catchphrase */
  catchphrase: string
  communityPhrases: string[]
  /** 9. Logo concept */
  logoConcept: string
  /** Mascot artwork URL (library image under /mascots, or an AI asset). Never an emoji. */
  mascot: string
  /** Plain-language subject, e.g. "sleepy cat" (used for AI image prompts). */
  subject?: string
  /** 10. Color palette */
  palette: PaletteColor[]
  /** 11. Social bio */
  socialBio: string
  /** 12. Website headline */
  websiteHeadline: string
  /** 13. Website description */
  websiteDescription: string
  /** 14. Meme ideas */
  memeIdeas: string[]
  /** 15. Launch-content ideas (creative, never financial) */
  launchIdeas: string[]
  lore: LoreStep[]
}

export type SocialPlatform = "x" | "instagram" | "tiktok" | "telegram" | "discord"
export type SocialBios = Record<SocialPlatform, string>

export const CONTENT_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "x", label: "X" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "telegram", label: "Telegram" },
  { id: "discord", label: "Discord" },
]

export const CONTENT_TYPES = [
  { id: "caption", label: "Meme caption" },
  { id: "announcement", label: "Announcement" },
  { id: "community", label: "Community post" },
  { id: "quote", label: "Character quote" },
  { id: "teaser", label: "Launch teaser" },
  { id: "lore", label: "Lore post" },
] as const
export type ContentTypeId = (typeof CONTENT_TYPES)[number]["id"]

export type MemeLayout = "top-bottom" | "caption-above" | "tweet" | "split"
export type MemeCardData = {
  id: string
  caption: string
  topText?: string
  bottomText?: string
  /** Mascot artwork URL shown on the meme. */
  mascot: string
  /** Legacy fields from older saves; not rendered. */
  emoji?: string
  props?: string[]
  layout: MemeLayout
  hue: number
  /** Optional AI-generated scene ("asset:<id>" or URL); the caption is overlaid in HTML. */
  imageRef?: string
}

export type DomainStatus =
  | "unchecked"
  | "checking"
  | "available"
  | "registered"
  | "no-record"
  | "unknown"
  | "error"

export type DomainCheckResult = {
  domain: string
  status: DomainStatus
  provider: string
  message?: string
  /** Registrar price string when the provider returns one, e.g. "3.99 USD". */
  price?: string
  checkedAt: string
}

export type SavedDomain = {
  domain: string
  topic: string
  status: DomainStatus
  savedAt: string
}

// ---------- Website builder ----------

export type SiteTemplateId = "classic" | "neon-arcade" | "y2k-chrome" | "sticker-bomb" | "minimal-luxe"
export type SiteFont = "bricolage" | "inter" | "rounded" | "mono" | "serif"
export type SiteBackground = "gradient" | "solid" | "grid" | "stars"
export type SiteButtonStyle = "solid" | "outline" | "pill" | "brutal"
export type SiteAnimation = "none" | "subtle" | "bouncy"
export type SiteSectionId = "hero" | "about" | "lore" | "token" | "memes" | "community" | "footer"

export type SiteConfig = {
  template?: SiteTemplateId
  /** mascotImage: optional AI image ("asset:<id>" locally, URL in the cloud, data: URL in exports). */
  brand: { name: string; ticker: string; domain: string; mascot: string; mascotImage?: string }
  hero: { headline: string; subheadline: string; quote: string; primaryCta: string; secondaryCta: string }
  about: { title: string; body: string }
  lore: { title: string; steps: LoreStep[] }
  token: {
    title: string
    network: string
    supply: string
    note: string
    /** Contract address (Solana mint). Turns on the buy button, market links and "How to buy". */
    contract?: string
    /** Custom buy link (https). Defaults to a Jupiter swap for the contract. */
    buyUrl?: string
    /** Custom DexScreener (or other chart) link. Defaults to the contract's DexScreener page. */
    dexUrl?: string
    /** Show the pump.fun link (default true). */
    pumpfun?: boolean
    /** Show the "How to buy" steps (default true). */
    howToBuy?: boolean
  }
  memes: { title: string; items: { caption: string; image?: string; emoji?: string }[] }
  community: { title: string; subtitle: string; links: { x: string; telegram: string; discord: string; tiktok?: string; instagram?: string; youtube?: string; website?: string } }
  footer: { text: string }
  theme: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    font: SiteFont
    radius: number
    animation: SiteAnimation
    backgroundStyle: SiteBackground
    buttonStyle: SiteButtonStyle
    mascotSize: number
  }
  sections: Record<SiteSectionId, boolean>
}

export type SavedProject = {
  id: string
  concept: MemeConcept
  site: SiteConfig | null
  slug: string
  published: boolean
  createdAt: string
  updatedAt: string
}
