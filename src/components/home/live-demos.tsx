"use client"
import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { CoinImage } from "@/components/shared/coin-image"

/** Types each domain idea out, one after another. */
export function TypingDomains({ domains }: { domains: string[] }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [chars, setChars] = useState(0)
  const word = domains[i % domains.length].replace(/\.fun$/, "")

  useEffect(() => {
    if (reduce) return
    const done = chars >= word.length
    const id = window.setTimeout(() => (done ? (setI((n) => n + 1), setChars(0)) : setChars((c) => c + 1)), done ? 1500 : 85)
    return () => window.clearTimeout(id)
  }, [chars, word, reduce])

  const shown = reduce ? word : word.slice(0, chars)
  return (
    <div className="font-mono">
      <p className="text-2xl sm:text-3xl" aria-live="off">
        {shown}
        <span className="text-lab">.fun</span>
        <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-[var(--lab)] motion-reduce:hidden" />
      </p>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {domains.slice(0, 3).map((d) => (
          <li key={d} className="truncate">{d}</li>
        ))}
      </ul>
    </div>
  )
}

/** Cycles through meme captions under the meme card. */
export function CyclingCaption({ captions }: { captions: string[] }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce || captions.length < 2) return
    const id = window.setInterval(() => setI((n) => n + 1), 2600)
    return () => window.clearInterval(id)
  }, [reduce, captions.length])
  return (
    <p key={i} className="min-h-[2.5rem] text-sm font-semibold motion-safe:animate-[fade-up_0.5s_ease-out]">
      {captions[i % captions.length]}
    </p>
  )
}

/** A library coin turning slowly on its axis. */
export function SpinningCoin({ src, fallback }: { src: string; fallback?: string }) {
  return (
    <div className="[perspective:800px]">
      <div className="motion-safe:animate-[coin-spin_7s_linear_infinite] [transform-style:preserve-3d]">
        <CoinImage src={src} fallback={fallback} alt="" size={200} className="size-32 sm:size-36" />
      </div>
    </div>
  )
}
