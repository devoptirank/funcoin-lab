"use client"
import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { CONTENT_PLATFORMS, CONTENT_TYPES, type ContentTypeId, type MemeConcept, type SocialPlatform } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/shared/copy-button"
import { EmptyState } from "@/components/shared/empty-state"
import { useStore } from "@/components/providers/store-provider"
import { brandRef, postJSON } from "@/lib/client-api"
import { cn } from "@/lib/utils"

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              value === o.id ? "border-transparent bg-lab-fill font-semibold text-lab-ink" : "border-border text-muted-foreground hover:border-lab-fill/60 hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function ContentGenerator({ concept }: { concept: MemeConcept }) {
  const { repo } = useStore()
  const [platform, setPlatform] = useState<SocialPlatform>("x")
  const [type, setType] = useState<ContentTypeId>("caption")
  const [variations, setVariations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await postJSON<{ variations: string[] }>("/api/generate/content", { brand: brandRef(concept), platform, contentType: type })
      setVariations(res.variations)
      repo.recordGeneration("content", brandRef(concept), res.variations, { platform, contentType: type }).catch(() => {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate content")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass flex flex-col gap-5 rounded-3xl p-5">
        <Chips label="Platform" options={CONTENT_PLATFORMS} value={platform} onChange={setPlatform} />
        <Chips label="Content type" options={CONTENT_TYPES.map((c) => ({ id: c.id, label: c.label }))} value={type} onChange={setType} />
        <Button variant="glow" size="xl" className="self-start" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate variations
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : variations.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {variations.map((v, i) => (
            <li key={i} className="glass flex flex-col gap-3 rounded-3xl p-5">
              <p className="flex-1 text-sm leading-relaxed whitespace-pre-line">{v}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{v.length} chars</span>
                <CopyButton text={v} label="Copy" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState emoji="📣" title="Pick a platform and a vibe" description={`Generate posts for ${concept.name}: captions, teasers, lore drops and more.`} />
      )}
    </div>
  )
}
