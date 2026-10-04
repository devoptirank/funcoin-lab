import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { ToolWorkspace } from "@/components/tools/tool-workspace"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Social Bio Generator",
  description: "Ready-to-use bios for X, Instagram, TikTok, Telegram and Discord, written in your meme's voice. One-click copy.",
  path: "/social",
})

export default function Page() {
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Social bio generator" title={<>Bios for <span className="text-lab">every platform</span></>} description="X, Instagram, TikTok, Telegram and Discord, written in your mascot's voice." className="mb-10" />
        <ToolWorkspace tool="social" />
      </div>
    </div>
  )
}
