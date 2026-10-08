import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import Link from "next/link"
import type { SiteConfig } from "@/lib/types"
import { MemeSite } from "@/components/site/meme-site"
import { ReportLink } from "@/components/site/report-link"
import { getPublishedSite } from "@/lib/data/server"
import { OG_IMAGE } from "@/lib/seo"

// Public, published meme sites. Only published projects that pass moderation (and whose owner isn't banned) are served.
const getSite = cache((slug: string): Promise<SiteConfig | null> => getPublishedSite(slug))

export async function generateMetadata({ params }: PageProps<"/site/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const site = await getSite(slug)
  if (!site) return { title: "Site not found" }
  return {
    title: { absolute: `${site.brand.name} ($${site.brand.ticker}): ${site.hero.subheadline}` },
    description: `${site.hero.subheadline} Built with FunCoin Lab.`,
    alternates: { canonical: `/site/${slug}` },
    openGraph: { title: `${site.brand.name} ($${site.brand.ticker})`, description: site.hero.headline, images: [site.brand.mascotImage?.startsWith("https://") ? site.brand.mascotImage : OG_IMAGE] },
    twitter: { card: "summary_large_image" },
  }
}

export default async function PublishedSitePage({ params }: PageProps<"/site/[slug]">) {
  const { slug } = await params
  const site = await getSite(slug)
  if (!site) notFound()
  return (
    <>
      <MemeSite config={site} className="min-h-dvh" />
      <div className="fixed right-3 bottom-3 z-50 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur">
        <Link href="/" className="hover:underline">
          Made with FunCoin Lab
        </Link>
        <span aria-hidden className="opacity-40">|</span>
        <ReportLink slug={slug} className="text-white/70 hover:text-white" />
      </div>
    </>
  )
}
