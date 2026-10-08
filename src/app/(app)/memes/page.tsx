import type { Metadata } from "next"
import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export const metadata: Metadata = { title: "Meme Generator" }

export default function Page() {
  return (
    <>
      <PageHeader title="Meme Generator" description="Meme cards starring your mascot. Copy captions, remix variations, keep it funny." />
      <ToolWorkspace tool="memes" />
    </>
  )
}
