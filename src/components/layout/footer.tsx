import Link from "next/link"
import { LogoMark } from "@/components/shared/logo-mark"

const columns = [
  {
    title: "Create",
    links: [
      { href: "/meme-coin-ideas", label: "Meme Ideas" },
      { href: "/fun-domain-generator", label: "Domain Generator" },
      { href: "/meme-brand-generator", label: "Brand Generator" },
      { href: "/meme-website-builder", label: "Website Builder" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/meme-name-generator", label: "Name Generator" },
      { href: "/meme-logo-generator", label: "Logo Generator" },
      { href: "/meme-generator", label: "Meme Generator" },
      { href: "/discover", label: "FunCoin Universe" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <LogoMark />
          <p className="text-muted-foreground">Built for internet culture.</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            FunCoin Lab is a creative branding and website-prototyping tool. Nothing here is financial advice.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FunCoin Lab · Made with memes
      </div>
    </footer>
  )
}
