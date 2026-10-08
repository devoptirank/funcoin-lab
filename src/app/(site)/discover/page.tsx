import Link from "next/link"
import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { DiscoverGrid } from "@/components/discover/discover-grid"
import { MascotArt } from "@/components/shared/mascot-art"
import { pageMetadata } from "@/lib/seo"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { MemeConcept, SiteConfig } from "@/lib/types"

export const metadata = pageMetadata({
  title: "FunCoin Universe: Meme Brand Ideas to Remix",
  description: "Browse example meme brands from the FunCoin Universe (mascots, names, .fun domains and website concepts), then remix any idea into your own.",
  path: "/discover",
})

// Community picks change when an admin features a site; refresh every few minutes.
export const revalidate = 300

type CommunityPick = { slug: string; name: string; ticker: string; tagline: string; image: string }

/**
 * Community picks: published sites the team featured for quality. Editorial only, never paid.
 * Hidden or removed sites and sites whose owner is banned are left out.
 */
async function communityPicks(): Promise<CommunityPick[]> {
  const sb = getSupabaseAdmin()
  if (!sb) return []
  const { data, error } = await sb
    .from("projects")
    .select("slug, name, concept, site, billing_accounts!inner(status)")
    .eq("featured", true)
    .eq("published", true)
    .eq("moderation_status", "ok")
    .neq("billing_accounts.status", "banned")
    .order("updated_at", { ascending: false })
    .limit(12)
  if (error || !data) return []
  return (data as unknown as { slug: string; name: string; concept: MemeConcept | null; site: SiteConfig | null }[]).map((r) => {
    const mascotImage = r.site?.brand.mascotImage
    return {
      slug: r.slug,
      name: r.site?.brand.name || r.concept?.name || r.name,
      ticker: r.site?.brand.ticker || r.concept?.ticker || "",
      tagline: r.concept?.tagline || r.site?.hero.subheadline || "",
      image: mascotImage?.startsWith("https://") ? mascotImage : r.concept?.mascot || r.site?.brand.mascot || "",
    }
  })
}

export default async function DiscoverPage() {
  const picks = await communityPicks().catch(() => [])
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          as="h1"
          eyebrow="Discover"
          title={<><span className="text-lab">FunCoin</span> Universe</>}
          description="Example meme brands to spark ideas: characters, lore and websites. Find one you like and remix it into your own."
          className="mb-10"
        />
        {picks.length > 0 && (
          <section aria-labelledby="community-picks" className="mb-14">
            <h2 id="community-picks" className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Community picks</h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">Sites built by the community, chosen by the FunCoin Lab team.</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((p) => (
                <li key={p.slug}>
                  <Link href={`/site/${p.slug}`} className="glass card-hover flex h-full items-center gap-4 rounded-2xl p-4">
                    <MascotArt value={p.image} className="size-14 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading text-lg font-extrabold">{p.name}</span>
                      {p.ticker && <span className="block text-xs font-semibold text-lab">${p.ticker}</span>}
                      {p.tagline && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{p.tagline}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <DiscoverGrid />
      </div>
    </div>
  )
}
