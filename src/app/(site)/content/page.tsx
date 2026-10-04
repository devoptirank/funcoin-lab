import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { ToolWorkspace } from "@/components/tools/tool-workspace"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Meme Content Generator",
  description: "Generate meme captions, announcements, community posts, character quotes, launch teasers and lore posts for X, Instagram, TikTok, Telegram and Discord.",
  path: "/content",
})

export default function Page() {
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Content generator" title={<>Posts that sound like <span className="text-lab">your meme</span></>} description="Pick a platform and a content type. Get several variations to copy." className="mb-10" />
        <ToolWorkspace tool="content" />
      </div>
    </div>
  )
}
