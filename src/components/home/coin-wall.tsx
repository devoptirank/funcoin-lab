"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useReducedMotion } from "framer-motion"
import { ArrowRight, Wand2 } from "lucide-react"
import { DISCOVER_PROJECTS, remixHref, type DiscoverProject } from "@/lib/discover"
import { CoinImage } from "@/components/shared/coin-image"
import { ButtonLink } from "@/components/shared/button-link"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/**
 * One row of coins that drifts sideways on its own. It is a real scroll container, so people can
 * swipe or drag it; the drift pauses while they hover or touch it.
 */
function Row({ items, speed, onPick }: { items: DiscoverProject[]; speed: number; onPick: (p: DiscoverProject) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    if (speed < 0) el.scrollLeft = el.scrollWidth / 2
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64)
      last = now
      if (!paused.current) {
        el.scrollLeft += (speed * dt) / 16
        const half = el.scrollWidth / 2
        if (el.scrollLeft >= half) el.scrollLeft -= half
        else if (el.scrollLeft <= 0) el.scrollLeft += half
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed, reduce])

  // Rendered twice so the loop is seamless; the copy is hidden from assistive tech.
  return (
    <div
      ref={ref}
      onPointerEnter={() => {
        paused.current = true
      }}
      onPointerLeave={() => {
        paused.current = false
      }}
      onTouchStart={() => {
        paused.current = true
      }}
      onTouchEnd={() => {
        paused.current = false
      }}
      className="no-scrollbar overflow-x-auto"
    >
      <ul className="flex w-max gap-3 px-2 py-2 sm:gap-4">
        {[...items, ...items].map((p, i) => (
          <li key={`${p.slug}-${i}`} aria-hidden={i >= items.length || undefined}>
            <button
              type="button"
              tabIndex={i >= items.length ? -1 : 0}
              onClick={() => onPick(p)}
              className="group flex w-36 flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-foreground/[0.04] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-44"
            >
              <CoinImage src={p.coin} fallback={p.mascot} alt="" size={160} className="size-28 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3 sm:size-36" />
              <span className="w-full truncate text-sm font-semibold">{p.name}</span>
              <span className="w-full truncate font-mono text-xs text-muted-foreground">${p.ticker}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CoinWall() {
  const [picked, setPicked] = useState<DiscoverProject | null>(null)
  const half = Math.ceil(DISCOVER_PROJECTS.length / 2)
  const top = DISCOVER_PROJECTS.slice(0, half)
  const bottom = DISCOVER_PROJECTS.slice(half)

  return (
    <section aria-labelledby="coin-wall-title" className="border-y border-border py-12 sm:py-16">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-3 px-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <h2 id="coin-wall-title" className="font-heading text-3xl font-extrabold sm:text-4xl">
          The coin wall
        </h2>
        <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          See every idea <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="flex flex-col gap-2 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <Row items={top} speed={0.45} onPick={setPicked} />
        <Row items={bottom.length ? bottom : top} speed={-0.45} onPick={setPicked} />
      </div>

      <Dialog open={Boolean(picked)} onOpenChange={(open) => !open && setPicked(null)}>
        <DialogContent className="sm:max-w-md">
          {picked && (
            <div className="flex flex-col items-center gap-4 text-center">
              <CoinImage src={picked.coin} fallback={picked.mascot} alt={`${picked.name} coin`} size={320} className="size-48" />
              <div>
                <DialogTitle className="font-heading text-2xl font-extrabold">{picked.name}</DialogTitle>
                <p className="mt-1 font-mono text-sm">
                  <span className="text-lab">${picked.ticker}</span> <span className="text-muted-foreground">{picked.domain}</span>
                </p>
              </div>
              <DialogDescription className="text-base">{picked.description}</DialogDescription>
              <p className="text-sm font-semibold">&ldquo;{picked.headline}&rdquo;</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <ButtonLink href={remixHref(picked)} variant="glow" size="lg" className="flex-1">
                  <Wand2 /> Remix this idea
                </ButtonLink>
                <ButtonLink href={`/discover/${picked.slug}`} variant="glass" size="lg" className="flex-1">
                  Full concept
                </ButtonLink>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
