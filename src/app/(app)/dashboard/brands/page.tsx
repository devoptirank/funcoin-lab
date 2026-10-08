"use client"
import { LayoutTemplate, Trash2 } from "lucide-react"
import { useRepoData } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDeleteProject } from "@/components/dashboard/project-actions"
import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState } from "@/components/shared/empty-state"
import { MascotLogo } from "@/components/shared/mascot-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function BrandsPage() {
  const { data, loading } = useRepoData((r) => r.listProjects(), [])
  const remove = useDeleteProject()
  return (
    <>
      <PageHeader title="My Brands" description="Brand profiles: mascot, slogan, personality and palette." />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
      ) : data.length === 0 ? (
        <EmptyState mascot="king" title="No brands yet" description="Generate a concept and hit Save to build your first brand." action={<ButtonLink href="/create" variant="glow" size="lg" className="px-4">Create a brand</ButtonLink>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map(({ id, concept: c }) => (
            <article key={id} className="glass card-hover flex flex-col gap-4 rounded-3xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <MascotLogo name={c.name} ticker={c.ticker} mascot={c.mascot} colors={c.palette.map((p) => p.hex)} showRing={false} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-2xl font-black">${c.ticker}</h2>
                  <p className="truncate text-sm text-muted-foreground">{c.domain}</p>
                </div>
              </div>
              <p className="font-semibold">{c.tagline}</p>
              <p className="text-sm text-muted-foreground italic">“{c.slogan}”</p>
              <p className="text-xs text-muted-foreground">{c.traits.join(" • ")}</p>
              <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
                {c.palette.map((p) => <span key={p.hex} className="flex-1" style={{ background: p.hex }} />)}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <ButtonLink href={`/create?project=${id}`} variant="glass" size="sm">View brand</ButtonLink>
                <ButtonLink href={`/editor/${id}`} variant="glass" size="sm"><LayoutTemplate /> Website</ButtonLink>
                <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label={`Delete ${c.name}`} onClick={() => remove(id, c.name)}>
                  <Trash2 />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
