import type { Metadata } from "next"
import { Suspense } from "react"
import { CreateFlow } from "@/components/create/create-flow"
import { GeneratingState } from "@/components/create/generating-state"
import { PageHeader } from "@/components/dashboard/page-header"

export const metadata: Metadata = { title: "Create" }

export default function CreatePage() {
  return (
    <>
      <PageHeader title="Create a meme brand" description="Pick a theme, personality and naming style. Get a name, ticker, .fun domain, lore, logo, memes and a website." />
      <Suspense fallback={<GeneratingState topic="" />}>
        <CreateFlow />
      </Suspense>
    </>
  )
}
