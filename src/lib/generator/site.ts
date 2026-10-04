import type { MemeConcept, SiteConfig } from "@/lib/types"

export const DEFAULT_COMMUNITY_LINKS = {
  x: process.env.NEXT_PUBLIC_DEFAULT_X_URL ?? "",
  telegram: process.env.NEXT_PUBLIC_DEFAULT_TELEGRAM_URL ?? "",
  discord: process.env.NEXT_PUBLIC_DEFAULT_DISCORD_URL ?? "",
}

/** Turn a generated concept into an editable .fun website. */
export function conceptToSite(c: MemeConcept): SiteConfig {
  const [p1, p2, p3, , p5] = c.palette.map((p) => p.hex)
  return {
    template: "classic",
    brand: { name: c.name, ticker: c.ticker, domain: c.domain, mascot: c.mascot },
    hero: {
      headline: c.websiteHeadline,
      subheadline: c.tagline,
      quote: c.catchphrase,
      primaryCta: "Join The Fun",
      secondaryCta: "View Memes",
    },
    about: { title: `Who is ${c.name}?`, body: `${c.websiteDescription}\n\n${c.originStory}` },
    lore: { title: "The Lore", steps: c.lore },
    token: {
      title: "Token",
      network: "Solana",
      supply: "TBA",
      contract: "",
      note: "Only trust the contract address published here and on our official channels.",
    },
    memes: {
      title: "Meme Gallery",
      items: c.memeIdeas.slice(0, 6).map((caption) => ({ emoji: c.mascot, caption })),
    },
    community: {
      title: "Join The Meme Community",
      subtitle: c.communityPhrases.join(" · "),
      links: { ...DEFAULT_COMMUNITY_LINKS },
    },
    footer: { text: `${c.name}. ${c.slogan} Built with FunCoin Lab.` },
    theme: {
      primary: p1 ?? "#A855F7",
      secondary: p2 ?? "#22D3EE",
      accent: p3 ?? "#39FF88",
      background: p5 && isDark(p5) ? p5 : "#0B0912",
      text: "#FFFFFF",
      font: "bricolage",
      radius: 20,
      animation: "subtle",
      backgroundStyle: "gradient",
      buttonStyle: "pill",
      mascotSize: 160,
    },
    sections: { hero: true, about: true, lore: true, token: true, memes: true, community: true, footer: true },
  }
}

function isDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return false
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 60
}
