"use client"
import { useRef, useState } from "react"
import { Download, ImageDown, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { MemeConcept } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/shared/copy-button"
import { MascotLogo, downloadPng, downloadSvg } from "@/components/shared/mascot-logo"
import { brandRef, postJSON } from "@/lib/client-api"
import { kebab } from "@/lib/generator/text"
import { imageBrand, useAssets, useGenerateAsset } from "@/lib/assets/store"
import { useImagesEnabled } from "@/lib/assets/status"
import { downloadAsset } from "./brand-kit"
import { cn } from "@/lib/utils"

type LogoResponse = { description: string; source: "ai" | "local" }

export function LogoStudio({ concept }: { concept: MemeConcept }) {
  return <LogoStudioInner key={concept.id} concept={concept} />
}

function LogoStudioInner({ concept }: { concept: MemeConcept }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const imagesEnabled = useImagesEnabled()
  const logos = useAssets(concept.id).filter((a) => a.type === "logo")
  const generateAsset = useGenerateAsset()
  const [variant, setVariant] = useState(0)
  const [description, setDescription] = useState(concept.logoConcept)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<"ai" | "vector">("ai")
  const [loading, setLoading] = useState(false)

  const selected = logos.find((l) => l.id === selectedId) ?? logos[0]
  const showAi = view === "ai" && Boolean(selected)

  const generate = async (nextVariant: boolean) => {
    setLoading(true)
    if (nextVariant) setVariant((v) => v + 1)
    try {
      const res = await postJSON<LogoResponse>("/api/generate/logo", { brand: brandRef({ ...concept, logoConcept: description }) })
      setDescription(res.description)
      if (imagesEnabled) {
        const asset = await generateAsset(concept.id, "logo", imageBrand({ ...concept, logoConcept: res.description }))
        setSelectedId(asset.id)
        setView("ai")
        toast.success("New AI logo generated")
      } else {
        toast.success("New logo concept ready")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Logo generation failed")
    } finally {
      setLoading(false)
    }
  }

  const file = kebab(concept.name) || "logo"
  const colors = concept.palette.map((p) => p.hex)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] border border-border bg-popover p-6">
          {showAi && selected ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL or storage URL
            <img src={selected.url} alt={`${concept.name} AI logo`} className="absolute inset-0 size-full object-cover" />
          ) : (
            <MascotLogo ref={svgRef} name={concept.name} ticker={concept.ticker} mascot={concept.mascot} colors={colors} variant={variant} className="max-w-sm" animated />
          )}
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-sm" role="status" aria-label="Generating logo">
              <Loader2 className="size-8 animate-spin text-lab" />
            </div>
          )}
        </div>
        {logos.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Logo view" className="flex rounded-full border border-border p-0.5 text-xs">
              {(["ai", "vector"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => setView(v)}
                  className={cn("rounded-full px-3 py-1 font-medium", view === v ? "bg-lab-fill text-lab-ink" : "text-muted-foreground")}
                >
                  {v === "ai" ? "AI image" : "Vector badge"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto" aria-label="Logo history">
              {logos.slice(0, 6).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(l.id)
                    setView("ai")
                  }}
                  aria-label="Show this logo version"
                  className={cn("size-9 shrink-0 overflow-hidden rounded-lg border", l.id === selected?.id && view === "ai" ? "border-lab-fill" : "border-border")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails of generated images */}
                  <img src={l.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold">Logo concept</h3>
          <p className="mt-2 text-lg leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {concept.palette.map((c) => (
            <span key={c.hex} className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-xs">
              <span className="size-5 rounded-full border border-white/20" style={{ background: c.hex }} aria-hidden />
              {c.name} <span className="font-mono text-muted-foreground">{c.hex}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="glow" size="lg" className="px-4" onClick={() => generate(false)} disabled={loading}>
            <Sparkles /> Generate Logo{imagesEnabled ? <span className="text-xs opacity-70">· 5 credits</span> : null}
          </Button>
          <Button variant="glass" size="lg" onClick={() => generate(true)} disabled={loading}>
            <RefreshCw /> Regenerate
          </Button>
          <Button
            variant="glass"
            size="lg"
            onClick={() => (showAi && selected ? downloadAsset(selected, concept.name) : downloadSvg(svgRef.current, `${file}-logo-concept.svg`))}
          >
            <Download /> Download Concept
          </Button>
          {!showAi && (
            <Button variant="ghost" size="lg" onClick={() => downloadPng(svgRef.current, `${file}-logo-concept.png`)}>
              <ImageDown /> PNG
            </Button>
          )}
          <CopyButton text={description} label="Copy prompt" size="default" variant="ghost" />
        </div>
        <p className="text-xs text-muted-foreground">
          {imagesEnabled
            ? "“Generate Logo” writes a new concept and renders it as an AI image. The vector badge is always available as a designer-friendly fallback."
            : "The badge is a generated vector concept you can hand to a designer. AI images turn on when an image model is configured."}{" "}
          Check trademarks before using any logo publicly.
        </p>
      </div>
    </div>
  )
}
