import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { DiscoverGrid } from "@/components/discover/discover-grid"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "FunCoin Universe: Meme Brand Ideas to Remix",
  description: "Browse example meme brands from the FunCoin Universe (mascots, names, .fun domains and website concepts), then remix any idea into your own.",
  path: "/discover",
})

export default function DiscoverPage() {
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
        <DiscoverGrid />
      </div>
    </div>
  )
}
