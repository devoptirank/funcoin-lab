"use client"
import { ImagePlus, Loader2, RefreshCw } from "lucide-react"
import { useAssetUrl } from "@/lib/assets/store"
import { motion } from "framer-motion"
import type { MemeCardData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CopyButton } from "./copy-button"
import { cn } from "@/lib/utils"
import { MascotArt } from "./mascot-art"

const impact = "font-heading font-black uppercase tracking-tight text-white [text-shadow:0_2px_0_#000,0_-2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_4px_14px_rgba(0,0,0,.5)]"

export function MemeImage(props: { meme: MemeCardData; name: string; className?: string }) {
  return props.meme.imageRef ? <AiMemeImage {...props} /> : <MascotMemeImage {...props} />
}

/** Meme on top of an AI-generated scene: classic top/bottom text, or a white caption band. */
function AiMemeImage({ meme, className }: { meme: MemeCardData; name: string; className?: string }) {
  const url = useAssetUrl(meme.imageRef)
  const topBottom = meme.layout === "top-bottom" && meme.topText
  return (
    <div className={cn("relative flex aspect-square w-full flex-col overflow-hidden rounded-2xl bg-foreground/10", className)} role="img" aria-label={meme.caption}>
      {!topBottom && <p className="line-clamp-3 bg-white px-4 py-2.5 text-[15px] leading-snug font-semibold text-black">{meme.caption}</p>}
      <div className="relative flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated image (object or storage URL) */}
        {url && <img src={url} alt="" className="absolute inset-0 size-full object-cover" />}
        {topBottom && (
          <div className="absolute inset-0 flex flex-col items-center justify-between px-4 pt-4 pb-8 text-center">
            <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.topText}</p>
            <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.bottomText}</p>
          </div>
        )}
      </div>
      <span className="absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/85 backdrop-blur">FunCoin Lab</span>
    </div>
  )
}

function MascotMemeImage({ meme, name, className }: { meme: MemeCardData; name: string; className?: string }) {
  const bg = `radial-gradient(circle at 30% 20%, hsl(${meme.hue} 95% 70%), hsl(${(meme.hue + 50) % 360} 85% 45%) 55%, hsl(${(meme.hue + 120) % 360} 70% 18%))`
  const mascotSrc = meme.mascot
  const mascot = <MascotArt value={mascotSrc} className="h-[62%] w-auto drop-shadow-[0_12px_18px_rgba(0,0,0,.35)]" />

  return (
    <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl", className)} role="img" aria-label={meme.caption}>
      {meme.layout === "tweet" ? (
        <div className="flex h-full flex-col bg-white p-4 text-left text-black">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center overflow-hidden rounded-full" style={{ background: bg }} aria-hidden>
              <MascotArt value={mascotSrc} className="size-8" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">{name}</p>
              <p className="text-xs text-neutral-500">@{name.replace(/\W/g, "").toLowerCase()}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-4 text-[15px] leading-snug">{meme.caption}</p>
          <div className="mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-xl" style={{ background: bg }}>
            {mascot}
          </div>
        </div>
      ) : meme.layout === "caption-above" ? (
        <div className="flex h-full flex-col bg-white">
          <p className="line-clamp-3 px-4 pt-3 pb-2 text-[15px] leading-snug font-semibold text-black">{meme.caption}</p>
          <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ background: bg }}>
            {mascot}
          </div>
        </div>
      ) : meme.layout === "split" ? (
        <div className="grid h-full grid-rows-2" style={{ background: bg }}>
          <div className="flex items-center gap-3 border-b-4 border-black/70 bg-black/25 px-4">
            <MascotArt value={mascotSrc} className="h-[70%] w-auto opacity-80 grayscale" />
            <p className={cn(impact, "text-lg leading-tight")}>Everyone else</p>
          </div>
          <div className="flex items-center gap-3 px-4">
            <MascotArt value={mascotSrc} className="h-[80%] w-auto -rotate-6" />
            <p className={cn(impact, "text-lg leading-tight")}>{name}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-between px-4 pt-4 pb-8 text-center" style={{ background: bg }}>
          <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.topText}</p>
          <MascotArt value={mascotSrc} className="h-[48%] w-auto drop-shadow-[0_12px_18px_rgba(0,0,0,.35)]" />
          <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.bottomText}</p>
        </div>
      )}
      <span className="absolute right-2 bottom-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur">FunCoin Lab</span>
    </div>
  )
}

export function MemeCard({
  meme,
  name,
  onVary,
  varying,
  onAiImage,
  aiLoading,
}: {
  meme: MemeCardData
  name: string
  onVary?: () => void
  varying?: boolean
  onAiImage?: () => void
  aiLoading?: boolean
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass card-hover flex flex-col gap-3 rounded-3xl p-3"
    >
      <MemeImage meme={meme} name={name} />
      <p className="px-1 text-sm leading-snug">{meme.caption}</p>
      <div className="mt-auto flex gap-2 px-1 pb-1">
        <CopyButton text={meme.caption} label="Copy caption" />
        {onAiImage && (
          <Button size="sm" variant="ghost" onClick={onAiImage} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            AI image <span className="text-xs opacity-60">· 4</span>
          </Button>
        )}
        {onVary && (
          <Button size="sm" variant="ghost" onClick={onVary} disabled={varying}>
            <RefreshCw className={cn(varying && "animate-spin")} />
            Variation
          </Button>
        )}
      </div>
    </motion.article>
  )
}
