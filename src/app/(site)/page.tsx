import type { Metadata } from "next"
import Link from "next/link"
import { ButtonLink } from "@/components/shared/button-link"
import { Hero } from "@/components/home/hero"
import { CoinWall } from "@/components/home/coin-wall"
import { TemplatesShowcase } from "@/components/home/templates-showcase"
import { LaunchChecklist, PricingTeaser, TokenTeaser } from "@/components/home/launch-sections"
import { HomeFaq, HOME_FAQS } from "@/components/home/home-faq"
import { DISCOVER_PROJECTS } from "@/lib/discover"
import { ArrowRight } from "lucide-react"
import { IdeaStory } from "@/components/home/idea-story"
import { KitBento } from "@/components/home/kit-bento"
import { generateConceptLocal } from "@/lib/generator/concept"
import { conceptToSite } from "@/lib/generator/site"
import { siteConfig } from "@/lib/site-config"
import { seoPages } from "@/content/seo-pages"
import { OG_IMAGE } from "@/lib/seo"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", type: "website", siteName: siteConfig.name, title: `${siteConfig.name}: ${siteConfig.tagline}`, description: siteConfig.description, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.tagline, images: [OG_IMAGE.url] },
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
  const storyCoin = DISCOVER_PROJECTS.find((p) => p.slug === "sleepy") ?? DISCOVER_PROJECTS[0]
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([...jsonLd, faqLd]).replace(/</g, "\\u003c") }} />
      <Hero />
      <CoinWall />
      <IdeaStory concept={concept} site={site} topic={STORY_TOPIC} />
      <KitBento concept={concept} coin={{ src: storyCoin.coin, fallback: storyCoin.mascot }} />
      <TemplatesShowcase site={site} />
      <LaunchChecklist />
      <PricingTeaser />
      <TokenTeaser />

      {/* Guides: every landing page, linked from the home page. */}
      <section aria-labelledby="guides-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
        <h2 id="guides-title" className="font-heading text-3xl font-extrabold sm:text-4xl">
          Guides and generators
        </h2>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {seoPages.map((p) => (
            <li key={p.slug} className="border-t border-border pt-4">
              <Link href={`/${p.slug}`} className="group block">
                <span className="block font-semibold group-hover:text-lab">{p.h1}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HomeFaq />

      {/* Final call to action. */}
      <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-28">
        <div aria-hidden className="absolute bottom-[-40%] left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[var(--violet)] blur-[170px] [opacity:var(--glow-opacity)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <h2 className="max-w-4xl font-heading text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            Your next internet meme <span className="text-lab">starts here.</span>
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-lg text-muted-foreground">Create the name. Build the brand. Make the meme. Have some fun.</p>
            <ButtonLink href="/create" variant="glow" size="xl" className="px-7">
              Mint my idea <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
