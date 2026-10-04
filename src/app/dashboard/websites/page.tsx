"use client"
import { ExternalLink, Eye, PencilRuler } from "lucide-react"
import { useRepoData } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { formatDate } from "@/components/dashboard/project-actions"
import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function WebsitesPage() {
  const { data, loading } = useRepoData(async (r) => (await r.listProjects()).filter((p) => p.site), [])
  return (
    <>
      <PageHeader title="My Websites" description=".fun websites generated from your brands." />
      {loading ? (
        <Skeleton className="h-56 rounded-3xl" />
      ) : data.length === 0 ? (
        <EmptyState emoji="🖥️" title="No websites yet" description="Every saved concept gets a website. Generate one and open the builder." action={<ButtonLink href="/create?goal=website" variant="glow" size="lg" className="px-4">Build a website</ButtonLink>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => {
            const t = p.site!.theme
            return (
              <article key={p.id} className="glass card-hover overflow-hidden rounded-3xl">
                <div className="flex h-36 items-center justify-between gap-3 px-5" style={{ background: `radial-gradient(80% 90% at 0% 0%, ${t.primary}99, transparent), ${t.background}`, color: t.text }}>
                  <p className="line-clamp-3 font-heading text-lg leading-tight font-black">{p.site!.hero.headline}</p>
                  <span className="text-5xl" aria-hidden>{p.site!.brand.mascot}</span>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-sm font-semibold">{p.site!.brand.domain}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-lab-fill/15 text-lab" : "bg-foreground/5 text-muted-foreground"}`}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {formatDate(p.updatedAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/editor/${p.id}`} variant="glow" size="sm" className="px-3"><PencilRuler /> Edit</ButtonLink>
                    <ButtonLink href={`/preview/${p.id}`} variant="glass" size="sm" target="_blank"><Eye /> Preview</ButtonLink>
                    {p.published && <ButtonLink href={`/site/${p.slug}`} variant="ghost" size="sm" target="_blank"><ExternalLink /> Live</ButtonLink>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
