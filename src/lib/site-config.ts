export const siteConfig = {
  name: "FunCoin Lab",
  tagline: "Turn ridiculous ideas into unforgettable meme brands.",
  description:
    "Generate meme coin concepts, names, .fun domain ideas, lore, logos, social content and a ready-to-preview landing page. Build the brand before you launch.",
  // Canonical domain for SEO. Production falls back to funcoinlab.com if the env var is missing.
  url: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://funcoinlab.com" : "http://localhost:3000")).replace(/\/$/, ""),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@funcoinlab.com",
  registrarSearchUrl: process.env.NEXT_PUBLIC_REGISTRAR_SEARCH_URL || "https://www.namecheap.com/domains/registration/results/?domain={domain}",
}

// Marketing site navigation. App tools live on the app host (see lib/hosts.ts).
export const mainNav = [
  { href: "/discover", label: "Discover" },
  { href: "/pricing", label: "Pricing" },
  { href: "/token", label: "Token" },
  { href: "/meme-coin-ideas", label: "Ideas" },
  { href: "/about", label: "About" },
]

export function absoluteUrl(path = "/") {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`
}
