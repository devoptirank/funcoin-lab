"use client"
import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { MemeCardData, MemeConcept } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MemeCard } from "@/components/shared/meme-card"
import { useStore } from "@/components/providers/store-provider"
import { generateMemesLocal, varyMeme } from "@/lib/generator/memes"
import { brandRef, postJSON } from "@/lib/client-api"
import { imageBrand, useGenerateAsset } from "@/lib/assets/store"
import { useImagesEnabled } from "@/lib/assets/status"

export function MemeGallery({ concept, count = 6 }: { concept: MemeConcept; count?: number }) {
  return <MemeGalleryInner key={concept.id} concept={concept} count={count} />
}

function MemeGalleryInner({ concept, count }: { concept: MemeConcept; count: number }) {
  const { repo } = useStore()
  // First batch is seeded by the concept and reuses its meme ideas as captions.
  const [memes, setMemes] = useState<MemeCardData[]>(() =>
    generateMemesLocal({ name: concept.name, mascot: concept.mascot, catchphrase: concept.catchphrase, traits: concept.traits }, count, concept.input.seed ?? 1).map(
      (m, i) => ({ ...m, caption: concept.memeIdeas[i] ?? m.caption }),
    ),
  )
  const [loading, setLoading] = useState(false)
  const [aiBusy, setAiBusy] = useState<Record<string, boolean>>({})
  const imagesEnabled = useImagesEnabled()
  const generateAsset = useGenerateAsset()

  const aiImage = async (meme: MemeCardData) => {
    setAiBusy((b) => ({ ...b, [meme.id]: true }))
    try {
      const asset = await generateAsset(concept.id, "meme", imageBrand(concept), { scene: meme.caption.slice(0, 200) })
      setMemes((all) => all.map((m) => (m.id === meme.id ? { ...m, imageRef: asset.ref } : m)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate the meme image")
    } finally {
      setAiBusy((b) => ({ ...b, [meme.id]: false }))
    }
  }
  const src = { name: concept.name, mascot: concept.mascot, catchphrase: concept.catchphrase, traits: concept.traits }

  const generate = async () => {
    setLoading(true)
    try {
      const res = await postJSON<{ memes: MemeCardData[] }>("/api/generate/memes", { brand: brandRef(concept) })
      setMemes(res.memes)
      repo.recordGeneration("meme", brandRef(concept), res.memes).catch(() => {})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate memes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Meme concepts starring {concept.name}. Keep it funny, never financial.</p>
        <Button variant="glow" size="lg" className="px-4" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate new batch
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)
          : memes.map((m) => (
              <MemeCard
                key={m.id}
                meme={m}
                name={concept.name}
                onVary={() => setMemes((all) => all.map((x) => (x.id === m.id ? varyMeme(m, src) : x)))}
                onAiImage={imagesEnabled ? () => aiImage(m) : undefined}
                aiLoading={aiBusy[m.id]}
              />
            ))}
      </div>
    </div>
  )
}
