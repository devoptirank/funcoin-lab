import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export default function Page() {
  return (
    <>
      <PageHeader title="Logo Generator" description="Logo concepts and downloadable vector badges." />
      <ToolWorkspace tool="logo" />
    </>
  )
}
