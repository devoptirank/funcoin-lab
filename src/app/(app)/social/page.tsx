import type { Metadata } from "next"
import { PageHeader } from "@/components/dashboard/page-header"
import { ToolWorkspace } from "@/components/tools/tool-workspace"

export const metadata: Metadata = { title: "Social Bios" }

export default function Page() {
  return (
    <>
      <PageHeader title="Social Bios" description="X, Instagram, TikTok, Telegram and Discord bios, written in your mascot's voice." />
      <ToolWorkspace tool="social" />
    </>
  )
}
