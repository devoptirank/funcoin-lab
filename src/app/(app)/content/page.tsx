import type { Metadata } from "next"
import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export const metadata: Metadata = { title: "Content Generator" }

export default function Page() {
  return (
    <>
      <PageHeader title="Content Generator" description="Captions, announcements, community posts, lore drops and teasers for every platform." />
      <ToolWorkspace tool="content" />
    </>
  )
}
