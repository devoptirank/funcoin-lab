import { Suspense } from "react"
import { CreateFlow } from "@/components/create/create-flow"
import { GeneratingState } from "@/components/create/generating-state"
import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Create a Meme Coin Brand",
  description: "Pick a theme, personality and naming style, then generate a full meme brand: name, ticker concept, .fun domain, lore, logo, memes and website.",
  path: "/create",
})

export default function CreatePage() {
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Idea generator" title={<>Cook up a <span className="text-lab">meme brand</span></>} className="mb-10" />
        <Suspense fallback={<GeneratingState topic="" />}>
          <CreateFlow />
        </Suspense>
      </div>
    </div>
  )
}
