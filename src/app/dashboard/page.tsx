"use client"
import Link from "next/link"
import { Globe, LayoutTemplate, Lightbulb, Plus, Sparkles } from "lucide-react"
import { useRepoData } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/components/dashboard/project-actions"
import type { Stats } from "@/lib/store/repo"

const CARDS: { key: keyof Stats; label: string; icon: typeof Lightbulb; color: string; href: string }[] = [
  { key: "ideas", label: "Ideas Created", icon: Lightbulb, color: "text-lab", href: "/dashboard/ideas" },
  { key: "brands", label: "Brands Created", icon: Sparkles, color: "text-lab", href: "/dashboard/brands" },
  { key: "websites", label: "Websites Created", icon: LayoutTemplate, color: "text-muted-foreground", href: "/dashboard/websites" },
  { key: "domains", label: "Saved Domains", icon: Globe, color: "text-lab", href: "/dashboard/domains" },
]

export default function DashboardOverview() {
  const stats = useRepoData((r) => r.stats(), { ideas: 0, brands: 0, websites: 0, domains: 0 })
  const projects = useRepoData((r) => r.listProjects(), [])

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your meme lab at a glance."
        action={
          <ButtonLink href="/create" variant="glow" size="lg" className="px-4">
            <Plus /> New idea
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href} className="glass card-hover rounded-3xl p-5">
            <c.icon className={`size-6 ${c.color}`} aria-hidden />
            <div className="mt-4 font-heading text-4xl font-black">{stats.loading ? <Skeleton className="h-10 w-12" /> : stats.data[c.key]}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 mb-4 font-heading text-xl font-bold">Recent projects</h2>
      {projects.loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : projects.data.length === 0 ? (
        <EmptyState
          emoji="🧪"
          title="Nothing cooking yet"
          description="Generate your first meme brand and save it. It'll show up here."
          action={<ButtonLink href="/create" variant="glow" size="lg" className="px-4">Create My Meme Coin</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.data.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link href={`/create?project=${p.id}`} className="glass card-hover flex items-center gap-4 rounded-3xl p-4">
                <span
                  className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl"
                  style={{ background: `linear-gradient(135deg, ${p.concept.palette[0]?.hex}, ${p.concept.palette[1]?.hex})` }}
                  aria-hidden
                >
                  {p.concept.mascot}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg font-bold">${p.concept.ticker}</p>
                  <p className="truncate text-sm text-muted-foreground">{p.concept.tagline}</p>
                  <p className="text-xs text-muted-foreground">Updated {formatDate(p.updatedAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
