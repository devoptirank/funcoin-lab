"use client"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRepoData, useStore } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { formatDate } from "@/components/dashboard/project-actions"
import { AffiliateNote, BuyDomainLink, DomainStatusBadge } from "@/components/tools/domain-finder"
import { ButtonLink } from "@/components/shared/button-link"
import { CopyButton } from "@/components/shared/copy-button"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function DomainsDashboard() {
  const { repo, bump } = useStore()
  const { data, loading } = useRepoData((r) => r.listDomains(), [])
  return (
    <>
      <PageHeader
        title="Saved Domains"
        description="Your shortlist of .fun names. Status reflects the last check. Confirm with a registrar before buying."
        action={<ButtonLink href="/domains" variant="glow" size="lg" className="px-4">Find more</ButtonLink>}
      />
      <AffiliateNote className="mb-4" />
      {loading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : data.length === 0 ? (
        <EmptyState emoji="🌐" title="No saved domains" description="Bookmark .fun ideas from the domain finder to collect them here." />
      ) : (
        <ul className="glass divide-y divide-border overflow-hidden rounded-3xl">
          {data.map((d) => (
            <li key={d.domain} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono font-semibold">{d.domain}</p>
                <p className="text-xs text-muted-foreground">{d.topic ? `For “${d.topic}” · ` : ""}Saved {formatDate(d.savedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <DomainStatusBadge status={d.status} />
                <CopyButton text={d.domain} size="icon-sm" />
                {d.status !== "registered" && <BuyDomainLink domain={d.domain} source="dashboard" available={d.status === "available"} />}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${d.domain}`}
                  onClick={async () => {
                    await repo.removeDomain(d.domain).catch((e: Error) => toast.error(e.message))
                    bump()
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
