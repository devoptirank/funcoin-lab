"use client"
import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { MemeConcept, SocialBios as Bios, SocialPlatform } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/shared/copy-button"
import { useStore } from "@/components/providers/store-provider"
import { generateSocialBiosLocal } from "@/lib/generator/social"
import { brandRef, postJSON } from "@/lib/client-api"
import { cn } from "@/lib/utils"

const PLATFORMS: { id: SocialPlatform; label: string; icon: string; limit: number; kind: string }[] = [
  { id: "x", label: "X bio", icon: "𝕏", limit: 160, kind: "Profile bio" },
  { id: "instagram", label: "Instagram bio", icon: "📸", limit: 150, kind: "Profile bio" },
  { id: "tiktok", label: "TikTok bio", icon: "🎵", limit: 80, kind: "Profile bio" },
  { id: "telegram", label: "Telegram description", icon: "✈️", limit: 255, kind: "Group description" },
  { id: "discord", label: "Discord description", icon: "🎮", limit: 300, kind: "Server description" },
]

export function SocialBios({ concept }: { concept: MemeConcept }) {
  return <SocialBiosInner key={concept.id} concept={concept} />
}

function SocialBiosInner({ concept }: { concept: MemeConcept }) {
  const { repo } = useStore()
  const [bios, setBios] = useState<Bios>(() => ({ ...generateSocialBiosLocal(concept), x: concept.socialBio }))
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await postJSON<{ bios: Bios }>("/api/generate/social", { brand: brandRef(concept) })
      setBios(res.bios)
      repo.recordGeneration("bios", brandRef(concept), res.bios).catch(() => {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate bios")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Ready-to-paste profiles. Character limits shown for each platform.</p>
        <Button variant="glow" size="lg" className="px-4" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Regenerate bios
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((p) => {
          const text = bios[p.id]
          const over = text.length > p.limit
          return (
            <article key={p.id} className={cn("glass flex flex-col gap-3 rounded-3xl p-5", loading && "animate-pulse")}>
              <header className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="grid size-8 place-items-center rounded-full bg-foreground/5" aria-hidden>
                    {p.icon}
                  </span>
                  {p.label}
                </h3>
                <CopyButton text={text} label="Copy" />
              </header>
              <p className="flex-1 text-sm leading-relaxed whitespace-pre-line">{text}</p>
              <p className={cn("text-right text-xs text-muted-foreground", over && "text-destructive")}>
                {text.length}/{p.limit} · {p.kind}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
