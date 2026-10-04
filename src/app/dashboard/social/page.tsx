import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export default function Page() {
  return (
    <>
      <PageHeader title="Social Content" description="Bios for every platform, plus posts for X, Instagram, TikTok, Telegram and Discord." />
      <ToolWorkspace tool="social-all" />
    </>
  )
}
