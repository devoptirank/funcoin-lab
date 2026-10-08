import Link from "next/link"
import { notFound } from "next/navigation"
import { Wand2 } from "lucide-react"
import { DISCOVER_PROJECTS, remixHref } from "@/lib/discover"
import { conceptForProject } from "@/lib/discover-concept"
import { conceptToSite } from "@/lib/generator/site"
import { pageMetadata } from "@/lib/seo"
import { absoluteUrl } from "@/lib/site-config"
import { ButtonLink } from "@/components/shared/button-link"
import { CoinImage } from "@/components/shared/coin-image"
import { SiteShowcase } from "@/components/home/site-showcase"

export const dynamicParams = false

export function generateStaticParams() {
  return DISCOVER_PROJECTS.map((p) => ({ slug: p.slug }))
}

const find = (slug: string) => DISCOVER_PROJECTS.find((p) => p.slug === slug)

export async function generateMetadata({ params }: PageProps<"/discover/[slug]">) {
  const { slug } = await params
  const p = find(slug)
  if (!p) return {}
  const meta = pageMetadata({
    title: `${p.name} ($${p.ticker}): Meme Coin Brand Idea`,
    description: `${p.description} See the coin art, lore and a website concept for ${p.domain}, then remix it into your own meme brand.`.slice(0, 160),
    path: `/discover/${p.slug}`,
    fileImage: true,
  })
  const image = { url: `/og/coin/${p.slug}`, width: 1200, height: 630, alt: `${p.name} coin`, type: "image/png" }
  return { ...meta, openGraph: { ...meta.openGraph, images: [image] }, twitter: { ...meta.twitter, images: [image.url] } }
}

export default async function DiscoverProjectPage({ params }: PageProps<"/discover/[slug]">) {
  const { slug } = await params
  const p = find(slug)
  if (!p) notFound()
  const concept = conceptForProject(p)
  const site = { ...conceptToSite(concept), brand: { ...conceptToSite(concept).brand, mascotImage: p.coin } }
  const related = DISCOVER_PROJECTS.filter((x) => x.slug !== p.slug && x.tags.some((t) => p.tags.includes(t))).slice(0, 4)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "FunCoin Lab", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Discover", item: absoluteUrl("/discover") },
      { "@type": "ListItem", position: 3, name: p.name, item: absoluteUrl(`/discover/${p.slug}`) },
    ],
  }

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href="/discover" className="hover:text-foreground">Discover</Link> <span aria-hidden>/</span> <span>{p.name}</span>
      </nav>

      <header className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <p className="font-mono text-lg">
            <span className="text-lab">${p.ticker}</span> <span className="text-muted-foreground">{p.domain}</span>
          </p>
          <h1 className="mt-3 font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">{p.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{p.description}</p>
          <p className="mt-4 font-heading text-2xl font-bold">&ldquo;{p.headline}&rdquo;</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Personality">
            {p.personality.map((t) => (
              <li key={t} className="rounded-full border border-border px-3 py-1 text-sm">{t}</li>
            ))}
          </ul>
          <ButtonLink href={remixHref(p)} variant="glow" size="xl" className="mt-8">
            <Wand2 /> Remix this idea
          </ButtonLink>
        </div>
        <CoinImage src={p.coin} fallback={p.mascot} alt={`${p.name} coin art`} size={640} priority sizes="(min-width: 1024px) 40vw, 90vw" className="mx-auto w-full max-w-[26rem]" />
      </header>

      <section aria-labelledby="lore-title" className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 id="lore-title" className="font-heading text-3xl font-extrabold">The lore</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{concept.originStory}</p>
          <h3 className="mt-8 font-semibold">Catchphrase</h3>
          <p className="mt-1 text-muted-foreground">{concept.catchphrase}</p>
          <h3 className="mt-6 font-semibold">Meme ideas</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            {concept.memeIdeas.slice(0, 4).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-3xl font-extrabold">Palette</h2>
          <div className="mt-4 flex h-20 overflow-hidden rounded-2xl" aria-hidden>
            {p.colors.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{p.colors.join("  ")}</p>
          <h2 className="mt-10 font-heading text-3xl font-extrabold">Social bio</h2>
          <p className="mt-4 rounded-2xl bg-foreground/[0.05] p-4 text-sm leading-relaxed whitespace-pre-line">{concept.socialBio}</p>
        </div>
      </section>

      <section aria-labelledby="site-title" className="mt-16">
        <h2 id="site-title" className="mb-6 font-heading text-3xl font-extrabold">Website concept</h2>
        <SiteShowcase site={site} />
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16">
          <h2 id="related-title" className="font-heading text-3xl font-extrabold">More like this</h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/discover/${r.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl p-3 text-center hover:bg-foreground/[0.04]">
                  <CoinImage src={r.coin} fallback={r.mascot} alt="" size={200} className="size-28 transition-transform group-hover:-translate-y-1" />
                  <span className="font-semibold">{r.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">${r.ticker}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-16 text-xs text-muted-foreground">
        An example brand concept for inspiration. Not a real token and not financial advice. Read the{" "}
        <Link href="/disclaimer" className="underline underline-offset-4">disclaimer</Link>.
      </p>
    </article>
  )
}
