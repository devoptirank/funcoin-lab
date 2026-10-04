"use client"
import { useMemo, useState } from "react"
import { Bookmark, BookmarkCheck, Shuffle, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { DISCOVER_FILTERS, DISCOVER_PROJECTS, remixHref, type DiscoverFilter, type DiscoverProject } from "@/lib/discover"
import { MascotLogo } from "@/components/shared/mascot-logo"
import { FictionalBadge } from "@/components/shared/fictional-badge"
import { ButtonLink } from "@/components/shared/button-link"
import { Button } from "@/components/ui/button"
import { useRepoData, useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function DiscoverGrid() {
  const [filter, setFilter] = useState<DiscoverFilter>("trending")
  const [randomOrder, setRandomOrder] = useState<DiscoverProject[] | null>(null)
  const { repo, bump } = useStore()
  const { data: bookmarks } = useRepoData((r) => r.listBookmarks(), [])

  const items = useMemo(() => {
    switch (filter) {
      case "newest":
        return [...DISCOVER_PROJECTS].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      case "trending":
        return [...DISCOVER_PROJECTS].sort((a, b) => a.editorsPick - b.editorsPick)
      case "random":
        return randomOrder ?? DISCOVER_PROJECTS
      default:
        return DISCOVER_PROJECTS.filter((p) => p.tags.includes(filter))
    }
  }, [filter, randomOrder])

  const toggle = async (p: DiscoverProject) => {
    try {
      const on = await repo.toggleBookmark(p.slug, { name: p.name, domain: p.domain })
      toast.success(on ? `Saved ${p.name}` : `Removed ${p.name}`)
      bump()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="-mx-4 overflow-x-auto px-4" role="tablist" aria-label="Sort and filter">
        <div className="flex w-max gap-2">
          {DISCOVER_FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => {
                if (f.id === "random") setRandomOrder(shuffle(DISCOVER_PROJECTS))
                setFilter(f.id)
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filter === f.id ? "border-transparent bg-lab-fill font-semibold text-lab-ink" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.id === "random" && <Shuffle className="size-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article key={p.slug} className="glass card-hover flex flex-col overflow-hidden rounded-3xl">
            {/* Mini website preview */}
            <div
              className="relative flex h-40 items-center gap-4 overflow-hidden px-5"
              style={{ background: `radial-gradient(70% 90% at 0% 0%, ${p.colors[0]}99, transparent), radial-gradient(60% 80% at 100% 100%, ${p.colors[1]}88, transparent), ${p.colors[3]}` }}
            >
              <div className="min-w-0 flex-1 text-white">
                <p className="text-[10px] font-bold tracking-widest uppercase opacity-70">{p.domain}</p>
                <p className="mt-1 line-clamp-2 font-heading text-xl leading-tight font-black">{p.headline}</p>
                <span className="mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: p.colors[0], color: "#000" }}>
                  Join The Fun
                </span>
              </div>
              <span className="text-6xl drop-shadow-lg" style={{ animation: "fc-bob 4s ease-in-out infinite" }} aria-hidden>
                {p.mascot}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <div className="w-14 shrink-0">
                  <MascotLogo name={p.name} ticker={p.ticker} mascot={p.mascot} colors={p.colors} showRing={false} variant={p.editorsPick} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-xl font-extrabold">${p.ticker}</h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.name} · {p.domain}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={bookmarks.includes(p.slug) ? "Remove bookmark" : "Bookmark"} onClick={() => toggle(p)}>
                  {bookmarks.includes(p.slug) ? <BookmarkCheck className="text-lab" /> : <Bookmark />}
                </Button>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{p.personality.join(" • ")}</p>
              <p className="flex-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="flex items-center justify-between gap-2">
                <FictionalBadge />
                <ButtonLink href={remixHref(p)} variant="glow" size="lg" className="px-4">
                  <Wand2 /> Remix This Idea
                </ButtonLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
