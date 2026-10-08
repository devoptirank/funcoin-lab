import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import Link from "next/link"
import type { SiteConfig } from "@/lib/types"
import { MemeSite } from "@/components/site/meme-site"
import { getPublishedSite } from "@/lib/data/server"

// Public, published meme sites. Only projects with published = true are served.
const getSite = cache((slug: string): Promise<SiteConfig | null> => getPublishedSite(slug))

export async function generateMetadata({ params }: PageProps<"/site/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const site = await getSite(slug)
  if (!site) return { title: "Site not found" }
  return {
    title: { absolute: `${site.brand.name} ($${site.brand.ticker}): ${site.hero.subheadline}` },
    description: `${site.hero.subheadline} Built with FunCoin Lab.`,
    alternates: { canonical: `/site/${slug}` },
    openGraph: { title: `${site.brand.name} ($${site.brand.ticker})`, description: site.hero.headline },
  }
}

export default async function PublishedSitePage({ params }: PageProps<"/site/[slug]">) {
  const { slug } = await params
  const site = await getSite(slug)
  if (!site) notFound()
  return (
    <>
      <MemeSite config={site} className="min-h-dvh" />
      <Link
        href="/"
        className="fixed right-3 bottom-3 z-50 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/80"
      >
        Made with FunCoin Lab
      </Link>
    </>
  )
}
