import type { Metadata } from "next"
import { SiteEditor } from "@/components/editor/site-editor"

export const metadata: Metadata = { title: "Website Editor", robots: { index: false, follow: false } }

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params
  return <SiteEditor projectId={id} />
}
