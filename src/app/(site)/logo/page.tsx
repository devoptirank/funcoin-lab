import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { ToolWorkspace } from "@/components/tools/tool-workspace"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Meme Logo Generator",
  description: "Generate a mascot logo concept, a downloadable vector badge and a matching palette for your meme brand.",
  path: "/logo",
})

export default function Page() {
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Logo generator" title={<>Your mascot, <span className="text-lab">logo-ready</span></>} description="An AI logo concept plus a vector badge you can download as SVG or PNG." className="mb-10" />
        <ToolWorkspace tool="logo" />
      </div>
    </div>
  )
}
