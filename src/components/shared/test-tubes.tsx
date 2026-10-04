import type { PaletteColor } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A palette shown as filled test tubes. Fill heights vary deterministically per index. */
export function TestTubes({ palette, size = "lg", className }: { palette: PaletteColor[]; size?: "sm" | "lg"; className?: string }) {
  const tube = size === "lg" ? "h-56 w-12 sm:w-16" : "h-32 w-9"
  return (
    <div className={cn("flex items-end justify-center gap-3 sm:gap-4", className)} role="list" aria-label="Brand palette">
      {palette.map((c, i) => (
        <div key={`${c.hex}-${i}`} role="listitem" className="flex flex-col items-center gap-2">
          <div className={cn("flex flex-col justify-end overflow-hidden rounded-t-lg rounded-b-full border border-border bg-foreground/[0.03]", tube)}>
            <div className="rounded-b-full" style={{ background: c.hex, height: `${55 + ((i * 17) % 40)}%` }} />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">{c.hex}</span>
          <span className="sr-only">{c.name}</span>
        </div>
      ))}
    </div>
  )
}
