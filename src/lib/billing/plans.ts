// Pricing lives here so it's easy to change. Prices are in USD; customers pay in crypto.

export type CreditPack = { id: string; name: string; credits: number; usd: number; tagline: string; best?: boolean }

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 50, usd: 5, tagline: "About 10 AI images" },
  { id: "creator", name: "Creator", credits: 150, usd: 12, tagline: "A full brand kit, twice", best: true },
  { id: "studio", name: "Studio", credits: 500, usd: 35, tagline: "For launching several brands" },
]

/** Credits per AI image, by asset type. */
export const IMAGE_COSTS = { logo: 5, mascot: 5, meme: 4, banner: 6, "site-hero": 6 } as const
export type CostedImage = keyof typeof IMAGE_COSTS

/** One-time credits for a new wallet account, so people can try the image tools. */
export const WELCOME_CREDITS = 10

export const packById = (id: string) => CREDIT_PACKS.find((p) => p.id === id)
