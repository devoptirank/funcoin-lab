import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { ToolWorkspace } from "@/components/tools/tool-workspace"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Meme Gallery Generator",
  description: "Generate meme concepts starring your mascot: image cards, captions you can copy, and endless variations.",
  path: "/memes",
})

export default function Page() {
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Meme gallery" title={<>Make the <span className="text-lab">memes</span></>} description="Meme cards starring your mascot. Copy captions, remix variations, keep it funny." className="mb-10" />
        <ToolWorkspace tool="memes" />
      </div>
    </div>
  )
}
