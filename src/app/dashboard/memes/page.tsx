import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export default function Page() {
  return (
    <>
      <PageHeader title="Meme Generator" description="Meme cards starring your mascot." />
      <ToolWorkspace tool="memes" />
    </>
  )
}
