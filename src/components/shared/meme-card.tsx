"use client"
import { ImagePlus, Loader2, RefreshCw } from "lucide-react"
import { useAssetUrl } from "@/lib/assets/store"
import { motion } from "framer-motion"
import type { MemeCardData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CopyButton } from "./copy-button"
import { cn } from "@/lib/utils"

const impact = "font-heading font-black uppercase tracking-tight text-white [text-shadow:0_2px_0_#000,0_-2px_0_#000,2px_0_0_#000,-2px_0_0_#000,0_4px_14px_rgba(0,0,0,.5)]"

export function MemeImage(props: { meme: MemeCardData; name: string; className?: string }) {
  return props.meme.imageRef ? <AiMemeImage {...props} /> : <EmojiMemeImage {...props} />
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
      <span className="absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/85 backdrop-blur">AI concept · FunCoin Lab</span>
    </div>
  )
}

function EmojiMemeImage({ meme, name, className }: { meme: MemeCardData; name: string; className?: string }) {
  const bg = `radial-gradient(circle at 30% 20%, hsl(${meme.hue} 95% 70%), hsl(${(meme.hue + 50) % 360} 85% 45%) 55%, hsl(${(meme.hue + 120) % 360} 70% 18%))`
  const mascot = (
    <div className="relative grid place-items-center">
      <span className="text-[5.5rem] leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,.35)] sm:text-8xl" aria-hidden>
        {meme.emoji}
      </span>
      {meme.props[0] && <span className="absolute -top-2 -right-6 rotate-12 text-4xl" aria-hidden>{meme.props[0]}</span>}
      {meme.props[1] && <span className="absolute -bottom-1 -left-6 -rotate-12 text-3xl" aria-hidden>{meme.props[1]}</span>}
    </div>
  )

  return (
    <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl", className)} role="img" aria-label={meme.caption}>
      {meme.layout === "tweet" ? (
        <div className="flex h-full flex-col bg-white p-4 text-left text-black">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full text-xl" style={{ background: bg }} aria-hidden>
              {meme.emoji}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">{name}</p>
              <p className="text-xs text-neutral-500">@{name.replace(/\W/g, "").toLowerCase()}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-4 text-[15px] leading-snug">{meme.caption}</p>
          <div className="mt-3 grid flex-1 place-items-center rounded-xl" style={{ background: bg }}>
            {mascot}
          </div>
        </div>
      ) : meme.layout === "caption-above" ? (
        <div className="flex h-full flex-col bg-white">
          <p className="line-clamp-3 px-4 pt-3 pb-2 text-[15px] leading-snug font-semibold text-black">{meme.caption}</p>
          <div className="grid flex-1 place-items-center" style={{ background: bg }}>
            {mascot}
          </div>
        </div>
      ) : meme.layout === "split" ? (
        <div className="grid h-full grid-rows-2" style={{ background: bg }}>
          <div className="flex items-center gap-3 border-b-4 border-black/70 bg-black/25 px-4">
            <span className="text-5xl grayscale" aria-hidden>{meme.emoji}</span>
            <p className={cn(impact, "text-lg leading-tight")}>Everyone else</p>
          </div>
          <div className="flex items-center gap-3 px-4">
            <span className="text-6xl" aria-hidden>{meme.emoji}{meme.props[0]}</span>
            <p className={cn(impact, "text-lg leading-tight")}>{name}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-between p-4 text-center" style={{ background: bg }}>
          <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.topText}</p>
          {mascot}
          <p className={cn(impact, "text-xl leading-tight sm:text-2xl")}>{meme.bottomText}</p>
        </div>
      )}
      <span className="absolute right-2 bottom-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur">
        concept · FunCoin Lab
      </span>
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
