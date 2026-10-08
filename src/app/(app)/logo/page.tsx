import type { Metadata } from "next"
import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export const metadata: Metadata = { title: "Logo Generator" }

export default function Page() {
  return (
    <>
      <PageHeader title="Logo Generator" description="An AI logo concept plus a vector badge you can download as SVG or PNG." />
      <ToolWorkspace tool="logo" />
    </>
  )
}
