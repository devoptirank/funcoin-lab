import type { Metadata } from "next"
import { Suspense } from "react"
import { DomainFinder } from "@/components/tools/domain-finder"
import { PageHeader } from "@/components/dashboard/page-header"

export const metadata: Metadata = { title: ".fun Domain Finder" }

export default async function DomainsPage({ searchParams }: PageProps<"/domains">) {
  const { topic } = await searchParams
  const initial = typeof topic === "string" ? topic.slice(0, 60) : ""
  return (
    <>
      <PageHeader title="Find your .fun name" description="Short, memorable, on-brand. We suggest the names. Your registrar confirms availability." />
      <Suspense>
        <DomainFinder initialTopic={initial} autoRun={Boolean(initial)} />
      </Suspense>
    </>
  )
}
