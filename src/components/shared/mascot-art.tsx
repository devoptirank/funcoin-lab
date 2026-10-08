"use client"
import { useAssetUrl } from "@/lib/assets/store"
import { resolveMascot } from "@/lib/mascots"
import { cn } from "@/lib/utils"

/** Renders a mascot reference (library image, AI asset or URL) as artwork. Never an emoji. */
export function MascotArt({ value, alt = "", className, style }: { value: string | undefined | null; alt?: string; className?: string; style?: React.CSSProperties }) {
  const url = useAssetUrl(resolveMascot(value))
  // eslint-disable-next-line @next/next/no-img-element -- local mascot files, object URLs and storage URLs
  return url ? <img src={url} alt={alt} draggable={false} className={cn("select-none object-contain", className)} style={style} /> : <span className={className} style={style} aria-hidden />
}
