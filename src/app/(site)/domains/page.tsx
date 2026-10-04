import { Suspense } from "react"
import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { DomainFinder } from "@/components/tools/domain-finder"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Find Your .fun Name",
  description: "Generate catchy .fun domain ideas for your meme. Copy names, save favorites and check them with a connected registrar before you buy.",
  path: "/domains",
})

export default async function DomainsPage({ searchParams }: PageProps<"/domains">) {
  const { topic } = await searchParams
  const initial = typeof topic === "string" ? topic.slice(0, 60) : ""
  return (
    <div className="relative isolate px-4 py-12 sm:px-6 sm:py-16">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          as="h1"
          eyebrow=".fun domain generator"
          title={<>Find Your <span className="text-lab">.fun</span> Name</>}
          description="Short, memorable, on-brand. We suggest the names. Your registrar confirms availability."
          className="mb-10"
        />
        <Suspense>
          <DomainFinder initialTopic={initial} autoRun={Boolean(initial)} />
        </Suspense>
      </div>
    </div>
  )
}
