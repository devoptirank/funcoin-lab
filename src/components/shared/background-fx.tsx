import { cn } from "@/lib/utils"

/** Quiet ambient atmosphere: two soft, low-opacity blooms. No grid, no particles, no animation. */
export function BackgroundFX({ className }: { className?: string; grid?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute -top-48 -left-40 size-[36rem] rounded-full bg-[var(--violet)] blur-[140px] [opacity:var(--glow-opacity)]" />
      <div className="absolute top-1/3 -right-48 size-[28rem] rounded-full bg-[var(--lab)] blur-[160px] [opacity:calc(var(--glow-opacity)*0.35)]" />
    </div>
  )
}
