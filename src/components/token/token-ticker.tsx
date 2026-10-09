"use client"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { usdCompact, usdPrice } from "@/lib/token-format"
import type { TokenMarket } from "@/lib/token-market"
import { cn } from "@/lib/utils"

const POLL_MS = 60_000

type Item = { key: string; label?: string; value: string; tone?: "up" | "down" | "accent" }

/**
 * A slim scrolling strip above the navbar on every page, linking to /token. Shows only figures the
 * market API actually returned; before they load (or if they never do) it shows the plain text items.
 * The whole strip is one link with a readable label; the moving copy is decorative.
 */
export function TokenTicker({ ticker, ca, href }: { ticker: string; ca: string; href: string }) {
  const [m, setM] = useState<TokenMarket | null>(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch("/api/token/market", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: TokenMarket | null) => {
          if (alive && d && !("error" in d)) setM(d)
        })
        .catch(() => {})
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, POLL_MS)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  const items: Item[] = [
    { key: "live", value: `$${ticker} is live on Solana`, tone: "accent" },
    ...(m?.priceUsd != null ? [{ key: "price", label: "Price", value: usdPrice(m.priceUsd) }] : []),
    ...(m?.change24h != null && m.change24h !== 0
      ? [{ key: "chg", label: "24h", value: `${m.change24h > 0 ? "+" : ""}${m.change24h.toFixed(2)}%`, tone: m.change24h > 0 ? ("up" as const) : ("down" as const) }]
      : []),
    ...(m?.marketCap != null ? [{ key: "mc", label: "Market cap", value: usdCompact(m.marketCap) }] : []),
    ...(m?.volume24h != null ? [{ key: "vol", label: "24h volume", value: usdCompact(m.volume24h) }] : []),
    ...(m?.holders ? [{ key: "holders", label: "Holders", value: `${m.holders.count.toLocaleString("en-US")}${m.holders.capped ? "+" : ""}` }] : []),
    { key: "ca", label: "CA", value: `${ca.slice(0, 4)}…${ca.slice(-4)}` },
    { key: "cta", value: "Live chart and official links", tone: "accent" },
  ]
  // Each half of the track repeats the items so it is always wider than the screen; the animation
  // moves by exactly one half, so the loop is seamless.
  const half = [0, 1, 2].flatMap((r) => items.map((it) => ({ ...it, key: `${r}-${it.key}` })))

  return (
    <a
      href={href}
      aria-label={`$${ticker} is live on Solana${m?.priceUsd != null ? `, price ${usdPrice(m.priceUsd)}` : ""}. View the live chart and official contract address.`}
      className="group relative z-50 flex h-9 items-center overflow-hidden border-b border-lab-fill/30 bg-[color-mix(in_oklab,var(--lab)_10%,var(--background))] text-xs sm:text-sm"
    >
      <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 bg-lab-fill px-3 font-heading font-extrabold text-lab-ink">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-lab-ink/60" />
          <span className="relative inline-flex size-2 rounded-full bg-lab-ink" />
        </span>
        ${ticker}
      </span>
      <span className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]" aria-hidden>
        <span className="flex w-max animate-marquee [animation-duration:60s] group-hover:[animation-play-state:paused] group-focus-visible:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0">
              {half.map((it) => (
                <span key={`${copy}-${it.key}`} className="flex shrink-0 items-center gap-1.5 px-4 whitespace-nowrap">
                  <span className="size-1 rounded-full bg-lab/60" />
                  {it.label && <span className="text-muted-foreground">{it.label}</span>}
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      it.tone === "accent" && "text-lab",
                      it.tone === "up" && "text-emerald-500",
                      it.tone === "down" && "text-red-500",
                    )}
                  >
                    {it.value}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </span>
      </span>
      <span className="relative z-10 hidden h-full shrink-0 items-center gap-1 border-l border-lab-fill/30 bg-background/80 px-3 font-semibold sm:flex">
        View token <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </a>
  )
}
