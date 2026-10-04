"use client"
import type { MemeConcept, SiteConfig, SiteTemplateId } from "@/lib/types"
import { SITE_TEMPLATES } from "@/lib/site/templates"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ImagePlus, Loader2, Smile } from "lucide-react"
import { toast } from "sonner"
import { imageBrand, useAssets, useGenerateAsset } from "@/lib/assets/store"
import { useImagesEnabled } from "@/lib/assets/status"
import { SITE_FONTS } from "@/components/site/meme-site"
import { ColorField, PanelGroup, RangeField, Segmented, TextField } from "./fields"

type Theme = SiteConfig["theme"]

const PRESETS: { name: string; colors: Pick<Theme, "primary" | "secondary" | "accent" | "background" | "text"> }[] = [
  { name: "FunCoin", colors: { primary: "#A855F7", secondary: "#FF3D9A", accent: "#39FF88", background: "#07060B", text: "#FFFFFF" } },
  { name: "Cyber", colors: { primary: "#22D3EE", secondary: "#A855F7", accent: "#FACC15", background: "#050816", text: "#E0F2FE" } },
  { name: "Sunny", colors: { primary: "#F97316", secondary: "#EC4899", accent: "#0EA5E9", background: "#FFF7ED", text: "#1C1917" } },
  { name: "Mint", colors: { primary: "#10B981", secondary: "#6366F1", accent: "#F43F5E", background: "#ECFDF5", text: "#052E16" } },
]

export function StylePanel({
  theme,
  onChange,
  mascot,
  onMascot,
  concept,
  template,
  onTemplate,
  mascotImage,
  onMascotImage,
}: {
  theme: Theme
  onChange: (patch: Partial<Theme>) => void
  mascot: string
  onMascot: (m: string) => void
  concept: MemeConcept
  template: SiteTemplateId
  onTemplate: (id: SiteTemplateId) => void
  mascotImage?: string
  onMascotImage: (ref: string | undefined) => void
}) {
  const conceptPreset = {
    primary: concept.palette[0]?.hex ?? theme.primary,
    secondary: concept.palette[1]?.hex ?? theme.secondary,
    accent: concept.palette[2]?.hex ?? theme.accent,
  }
  return (
    <div>
      <PanelGroup title="Template">
        <div role="radiogroup" aria-label="Site template" className="grid grid-cols-2 gap-2">
          {SITE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={template === t.id}
              title={t.description}
              onClick={() => onTemplate(t.id)}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors",
                template === t.id ? "border-lab-fill bg-lab-fill/20 ring-2 ring-lab-fill/60" : "border-border hover:border-lab-fill/60",
              )}
            >
              <span className="flex h-8 overflow-hidden rounded-md" aria-hidden>
                <span className="flex-[2]" style={{ background: t.swatch[0] }} />
                <span className="flex-1" style={{ background: t.swatch[1] }} />
                <span className="flex-1" style={{ background: t.swatch[2] }} />
              </span>
              <span className="flex items-center justify-between gap-1 text-xs font-semibold">
                {t.name}
                {t.pro && <span className="rounded bg-foreground/10 px-1 py-px text-[10px] font-medium text-muted-foreground">Pro</span>}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Templates change layout, type and motion. Pro templates are free until paid plans launch.</p>
      </PanelGroup>
      <PanelGroup title="Colors">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onChange(conceptPreset)} className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs hover:border-lab-fill">
            <span className="flex">{concept.palette.slice(0, 3).map((c) => <span key={c.hex} className="-ml-1 size-3 rounded-full first:ml-0" style={{ background: c.hex }} />)}</span>
            Brand
          </button>
          {PRESETS.map((p) => (
            <button key={p.name} type="button" onClick={() => onChange(p.colors)} className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs hover:border-lab-fill">
              <span className="flex">{[p.colors.primary, p.colors.secondary, p.colors.background].map((c) => <span key={c} className="-ml-1 size-3 rounded-full border border-black/10 first:ml-0" style={{ background: c }} />)}</span>
              {p.name}
            </button>
          ))}
        </div>
        <ColorField label="Primary" value={theme.primary} onChange={(v) => onChange({ primary: v })} />
        <ColorField label="Secondary" value={theme.secondary} onChange={(v) => onChange({ secondary: v })} />
        <ColorField label="Accent" value={theme.accent} onChange={(v) => onChange({ accent: v })} />
        <ColorField label="Background" value={theme.background} onChange={(v) => onChange({ background: v })} />
        <ColorField label="Text" value={theme.text} onChange={(v) => onChange({ text: v })} />
      </PanelGroup>
      <PanelGroup title="Fonts">
        <label className="sr-only" htmlFor="site-font">Font</label>
        <select
          id="site-font"
          value={theme.font}
          onChange={(e) => onChange({ font: e.target.value as Theme["font"] })}
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
        >
          {Object.entries(SITE_FONTS).map(([id, f]) => (
            <option key={id} value={id}>{f.label}</option>
          ))}
        </select>
      </PanelGroup>
      <PanelGroup title="Border radius">
        <RangeField label="Corners" value={theme.radius} min={0} max={40} unit="px" onChange={(v) => onChange({ radius: v })} />
      </PanelGroup>
      <PanelGroup title="Animations">
        <Segmented label="Mascot motion" value={theme.animation} onChange={(v) => onChange({ animation: v })} options={[{ id: "none", label: "None" }, { id: "subtle", label: "Subtle" }, { id: "bouncy", label: "Bouncy" }]} />
      </PanelGroup>
      <PanelGroup title="Background">
        <Segmented label="Style" value={theme.backgroundStyle} onChange={(v) => onChange({ backgroundStyle: v })} options={[{ id: "gradient", label: "Gradient" }, { id: "solid", label: "Solid" }, { id: "grid", label: "Grid" }, { id: "stars", label: "Stars" }]} />
      </PanelGroup>
      <PanelGroup title="Mascot">
        <MascotPicker concept={concept} value={mascotImage} onChange={onMascotImage} />
        <TextField label="Mascot emoji" value={mascot} maxLength={8} onChange={onMascot} />
        <RangeField label="Size" value={theme.mascotSize} min={80} max={260} unit="px" onChange={(v) => onChange({ mascotSize: v })} />
      </PanelGroup>
      <PanelGroup title="Buttons">
        <Segmented label="Button style" value={theme.buttonStyle} onChange={(v) => onChange({ buttonStyle: v })} options={[{ id: "solid", label: "Solid" }, { id: "outline", label: "Outline" }, { id: "pill", label: "Pill" }, { id: "brutal", label: "Brutal" }]} />
      </PanelGroup>
    </div>
  )
}

function MascotPicker({ concept, value, onChange }: { concept: MemeConcept; value?: string; onChange: (ref: string | undefined) => void }) {
  const enabled = useImagesEnabled()
  const images = useAssets(concept.id).filter((a) => a.type === "mascot" || a.type === "logo")
  const generate = useGenerateAsset()
  const [busy, setBusy] = useState(false)
  if (enabled === false && images.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Mascot artwork</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Mascot artwork">
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          onClick={() => onChange(undefined)}
          className={cn("grid size-12 place-items-center rounded-lg border text-xl", !value ? "border-lab-fill" : "border-border")}
          title="Use the emoji"
        >
          <Smile className="size-5" aria-label="Emoji" />
        </button>
        {images.slice(0, 7).map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={value === a.ref}
            onClick={() => onChange(a.ref)}
            className={cn("size-12 overflow-hidden rounded-lg border", value === a.ref ? "border-lab-fill ring-2 ring-lab-fill/40" : "border-border")}
            title={a.pose ? `Mascot: ${a.pose}` : "Logo"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- generated thumbnail */}
            <img src={a.url} alt="" className="size-full object-cover" />
          </button>
        ))}
        {enabled && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                const asset = await generate(concept.id, "mascot", imageBrand(concept), { pose: "happy" })
                onChange(asset.ref)
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Couldn't generate the mascot")
              } finally {
                setBusy(false)
              }
            }}
            className="grid size-12 place-items-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-lab-fill/60 hover:text-foreground"
            title="Generate AI mascot"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" aria-label="Generate AI mascot" />}
          </button>
        )}
      </div>
    </div>
  )
}
