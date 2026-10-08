import type { Metadata } from "next"
import Link from "next/link"
import { ButtonLink } from "@/components/shared/button-link"
import { Hero } from "@/components/home/hero"
import { ExamplesMarquee } from "@/components/home/examples-marquee"
import { IdeaStory } from "@/components/home/idea-story"
import { KitBento } from "@/components/home/kit-bento"
import { generateConceptLocal } from "@/lib/generator/concept"
import { conceptToSite } from "@/lib/generator/site"
import { siteConfig } from "@/lib/site-config"
import { seoPages } from "@/content/seo-pages"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: `${siteConfig.name}: ${siteConfig.tagline}`, description: siteConfig.description },
}

// Organization + WebSite + the app itself, so search engines understand the brand and the product.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    email: siteConfig.contactEmail,
    sameAs: Object.values(siteConfig.social).filter(Boolean),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.appUrl,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free to start. AI image credits are optional." },
    featureList: ["Meme coin name and ticker ideas", ".fun domain ideas", "Mascot logo generator", "Meme generator", "Social bios and posts", "Landing page builder"],
  },
]

const STORY_TOPIC = "sleepy cat"

export default function HomePage() {
  const concept = generateConceptLocal({ topic: STORY_TOPIC, theme: "animals", personality: "cute", namingStyle: "short", seed: 2026 })
  const site = conceptToSite(concept)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />

      <section aria-label="Example concepts" className="border-y border-border py-6">
        <p className="sr-only">Freshly generated brand concepts</p>
        <ExamplesMarquee />
      </section>

      <IdeaStory concept={concept} site={site} topic={STORY_TOPIC} />

      <KitBento concept={concept} />

      {/* Guides: every landing page, linked from the home page. */}
      <section aria-labelledby="guides-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <h2 id="guides-title" className="font-heading text-3xl font-extrabold sm:text-4xl">
          Guides and generators
        </h2>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {seoPages.map((p) => (
            <li key={p.slug} className="border-t border-border pt-4">
              <Link href={`/${p.slug}`} className="group block">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{p.eyebrow}</span>
                <span className="mt-1 block font-semibold group-hover:text-lab">{p.h1}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Principles: a plain statement, no card. */}
      <section aria-labelledby="principles-title" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-8 border-t border-border pt-12 lg:grid-cols-[1fr_1.2fr]">
          <h2 id="principles-title" className="font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
            Creative, not financial.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              FunCoin Lab makes names, lore, logos and website prototypes. We don&apos;t create, list or sell tokens, show prices or give investment advice.
            </p>
            <p>
              Generated copy never promises gains, and every site carries a risk notice.{" "}
              <Link href="/disclaimer" className="text-foreground underline underline-offset-4">
                Read the disclaimer
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA: editorial, left-aligned. */}
      <section className="relative isolate overflow-hidden px-4 py-28 sm:px-6">
        <div aria-hidden className="absolute bottom-[-40%] left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[var(--violet)] blur-[170px] [opacity:var(--glow-opacity)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <h2 className="max-w-4xl font-heading text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            Your next internet meme <span className="text-lab">starts here.</span>
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-lg text-muted-foreground">Create the name. Build the brand. Make the meme. Have some fun.</p>
            <ButtonLink href="/create" variant="glow" size="xl" className="px-7">
              Create Your Idea →
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
