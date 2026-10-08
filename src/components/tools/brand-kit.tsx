"use client"
import { useState } from "react"
import { Download, ImageOff, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { MemeConcept } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { imageBrand, useAssets, useGenerateAsset, useRemoveAsset, type AssetRecord, type AssetType } from "@/lib/assets/store"
import { useImagesEnabled } from "@/lib/assets/status"
import { downloadFile } from "@/lib/client-api"
import { kebab } from "@/lib/generator/text"
import { cn } from "@/lib/utils"
import { usePublicSettings } from "@/lib/public-settings"

type Slot = { key: string; type: AssetType; pose?: string; label: string; hint: string; aspect: string; span: string }

const SLOTS: Slot[] = [
  { key: "logo", type: "logo", label: "Logo mark", hint: "Mascot badge on a solid background.", aspect: "aspect-square", span: "sm:col-span-2 sm:row-span-2" },
  { key: "mascot-happy", type: "mascot", pose: "happy", label: "Happy", hint: "Mascot pose", aspect: "aspect-square", span: "" },
  { key: "mascot-sleepy", type: "mascot", pose: "sleepy", label: "Sleepy", hint: "Mascot pose", aspect: "aspect-square", span: "" },
  { key: "mascot-angry", type: "mascot", pose: "angry", label: "Angry", hint: "Mascot pose", aspect: "aspect-square", span: "" },
  { key: "mascot-celebrating", type: "mascot", pose: "celebrating", label: "Celebrating", hint: "Mascot pose", aspect: "aspect-square", span: "" },
  { key: "banner", type: "banner", label: "X header", hint: "1536 × 512 banner.", aspect: "aspect-[3/1]", span: "sm:col-span-4" },
  { key: "site-hero", type: "site-hero", label: "Website hero art", hint: "1536 × 1024, for your .fun site.", aspect: "aspect-[5/2]", span: "sm:col-span-4" },
]

const matches = (a: AssetRecord, s: Slot) => a.type === s.type && (s.pose ? a.pose === s.pose : true)

export function downloadAsset(asset: AssetRecord, name: string) {
  fetch(asset.url)
    .then((r) => r.blob())
    .then((blob) => downloadFile(`${kebab(name) || "funcoin"}-${asset.type}${asset.pose ? `-${asset.pose}` : ""}.${blob.type.split("/")[1] || "webp"}`, blob))
    .catch(() => toast.error("Couldn't download that image"))
}

export function BrandKit({ concept }: { concept: MemeConcept }) {
  const IMAGE_COSTS = usePublicSettings().pricing.imageCosts
  const enabled = useImagesEnabled()
  const assets = useAssets(concept.id)
  const generate = useGenerateAsset()
  const remove = useRemoveAsset()
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const run = async (slot: Slot) => {
    setBusy((b) => ({ ...b, [slot.key]: true }))
    try {
      await generate(concept.id, slot.type, imageBrand(concept), { pose: slot.pose })
      toast.success(`${slot.label} generated`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed")
    } finally {
      setBusy((b) => ({ ...b, [slot.key]: false }))
    }
  }

  if (enabled === false) {
    return (
      <div className="flex items-start gap-3 rounded-[2rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
        <ImageOff className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          AI images aren&apos;t configured on this deployment. Set <code className="font-mono text-foreground">OPENAI_API_KEY</code> and{" "}
          <code className="font-mono text-foreground">IMAGE_PROVIDER=openai</code> to generate logos, mascot poses and banners. The vector badge in the logo
          section still works without it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Generated with OpenAI from your brand&apos;s mascot, personality and palette. Each image takes about 20 to 40 seconds and costs {Math.min(...Object.values(IMAGE_COSTS))} to {Math.max(...Object.values(IMAGE_COSTS))} credits; failed images are refunded automatically.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SLOTS.map((slot) => {
          const history = assets.filter((a) => matches(a, slot))
          const latest = history[0]
          const loading = busy[slot.key]
          return (
            <figure key={slot.key} className={cn("group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-popover", slot.span)}>
              <div className={cn("relative w-full overflow-hidden bg-foreground/[0.04]", slot.aspect, slot.span.includes("row-span-2") && "sm:aspect-auto sm:flex-1")}>
                {loading ? (
                  <Skeleton className="absolute inset-0 rounded-none" />
                ) : latest ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob/object URLs and storage URLs
                  <img src={latest.url} alt={`${concept.name} ${slot.label.toLowerCase()}`} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <button
                    type="button"
                    onClick={() => run(slot)}
                    disabled={enabled === null}
                    className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                  >
                    <span className="flex flex-col items-center gap-2 px-3">
                      <Sparkles className="size-5 text-lab" aria-hidden />
                      Generate {slot.label.toLowerCase()}
                      <span className="text-xs opacity-70">{IMAGE_COSTS[slot.type]} credits</span>
                    </span>
                  </button>
                )}
                {loading && (
                  <span className="absolute inset-0 grid place-items-center">
                    <Loader2 className="size-6 animate-spin text-lab" aria-label="Generating" />
                  </span>
                )}
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{slot.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{history.length > 1 ? `${history.length} versions` : slot.hint}</p>
                </div>
                {latest && (
                  <div className="flex shrink-0 gap-0.5">
                    <Button size="icon-sm" variant="ghost" aria-label={`Regenerate ${slot.label}`} onClick={() => run(slot)} disabled={loading}>
                      <RefreshCw />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label={`Download ${slot.label}`} onClick={() => downloadAsset(latest, concept.name)}>
                      <Download />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label={`Delete latest ${slot.label}`} onClick={() => remove(latest.id).catch(() => toast.error("Couldn't delete"))}>
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
