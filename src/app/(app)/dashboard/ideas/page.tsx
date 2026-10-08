"use client"
import Link from "next/link"
import { Trash2, Wand2 } from "lucide-react"
import { useRepoData } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { formatDate, useDeleteProject } from "@/components/dashboard/project-actions"
import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MascotArt } from "@/components/shared/mascot-art"
import { namingLabel, personalityLabel, themeLabel } from "@/lib/generator/concept"

export default function IdeasPage() {
  const { data, loading } = useRepoData((r) => r.listProjects(), [])
  const remove = useDeleteProject()
  return (
    <>
      <PageHeader title="My Ideas" description="Every concept you've saved, with the recipe that made it." />
      {loading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : data.length === 0 ? (
        <EmptyState mascot="brain" title="No saved ideas" description="Save a generated concept to keep it here." action={<ButtonLink href="/create" variant="glow" size="lg" className="px-4">Generate an idea</ButtonLink>} />
      ) : (
        <ul className="glass divide-y divide-border overflow-hidden rounded-3xl">
          {data.map((p) => {
            const i = p.concept.input
            const remix = new URLSearchParams({ topic: i.topic, theme: i.theme, personality: i.personality, style: i.namingStyle })
            return (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <MascotArt value={p.concept.mascot} className="size-10 shrink-0" />
                <Link href={`/create?project=${p.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="font-semibold">
                    {p.concept.name} <span className="text-muted-foreground">${p.concept.ticker}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.topic || "Surprise"} · {themeLabel(i.theme)} · {personalityLabel(i.personality)} · {namingLabel(i.namingStyle)} · {formatDate(p.createdAt)}
                  </p>
                </Link>
                <div className="flex gap-2">
                  <ButtonLink href={`/create?${remix.toString()}`} variant="glass" size="sm">
                    <Wand2 /> Remix
                  </ButtonLink>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.concept.name}`} onClick={() => remove(p.id, p.concept.name)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
