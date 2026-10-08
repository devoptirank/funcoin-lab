"use client"
import { useEffect, useState } from "react"
import { Loader2, PencilRuler } from "lucide-react"
import type { SiteConfig } from "@/lib/types"
import { MemeSite } from "./meme-site"
import { useStore } from "@/components/providers/store-provider"
import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState } from "@/components/shared/empty-state"
import { conceptToSite } from "@/lib/generator/site"

/** Full-screen preview of a saved (possibly unpublished) site, read from the user's own store. */
export function LocalPreview({ id }: { id: string }) {
  const { repo, ready } = useStore()
  const [site, setSite] = useState<SiteConfig | null | undefined>(undefined)
  useEffect(() => {
    if (!ready) return
    repo.getProject(id).then((p) => setSite(p ? (p.site ?? conceptToSite(p.concept)) : null)).catch(() => setSite(null))
  }, [id, ready, repo])

  if (site === undefined) return <div className="grid min-h-dvh place-items-center"><Loader2 className="size-8 animate-spin text-lab" /></div>
  if (site === null) return <div className="grid min-h-dvh place-items-center p-4"><EmptyState mascot="ghost" title="Preview not found" description="This project doesn't exist or belongs to a different wallet." /></div>
  return (
    <div className="relative min-h-dvh">
      <MemeSite config={site} className="min-h-dvh" />
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/70 py-1.5 pr-1.5 pl-4 text-xs text-white backdrop-blur">
        Preview · not public
        <ButtonLink href={`/editor/${id}`} variant="glow" size="sm" className="px-3">
          <PencilRuler /> Edit
        </ButtonLink>
      </div>
    </div>
  )
}
