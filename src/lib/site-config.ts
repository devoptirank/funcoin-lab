export const siteConfig = {
  name: "FunCoin Lab",
  tagline: "Turn ridiculous ideas into unforgettable meme brands.",
  description:
    "Generate meme coin concepts, names, .fun domain ideas, lore, logos, social content and a ready-to-preview landing page. Build the brand before you launch.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com",
  registrarSearchUrl: process.env.NEXT_PUBLIC_REGISTRAR_SEARCH_URL || "https://www.namecheap.com/domains/registration/results/?domain={domain}",
  social: {
    x: process.env.NEXT_PUBLIC_X_URL || "",
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || "",
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || "",
  },
}

export const mainNav = [
  { href: "/create", label: "Create" },
  { href: "/domains", label: ".fun Domains" },
  { href: "/memes", label: "Memes" },
  { href: "/content", label: "Content" },
  { href: "/discover", label: "Discover" },
  { href: "/pricing", label: "Pricing" },
]

export const toolNav = [
  { href: "/create", label: "Idea Generator", emoji: "🧪" },
  { href: "/domains", label: ".fun Domain Finder", emoji: "🌐" },
  { href: "/logo", label: "Logo Generator", emoji: "🎨" },
  { href: "/memes", label: "Meme Gallery", emoji: "🖼️" },
  { href: "/social", label: "Social Bios", emoji: "📝" },
  { href: "/content", label: "Content Generator", emoji: "📣" },
]

export function absoluteUrl(path = "/") {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`
}
