import type { Metadata } from "next"
import { LocalPreview } from "@/components/site/local-preview"

export const metadata: Metadata = { title: "Website Preview", robots: { index: false, follow: false } }

export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  const { id } = await params
  return <LocalPreview id={id} />
}
