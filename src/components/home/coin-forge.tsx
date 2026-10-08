"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { CoinImage } from "@/components/shared/coin-image"
import { DISCOVER_PROJECTS, type DiscoverProject } from "@/lib/discover"
import { mascotForTopic, mascotUrl } from "@/lib/mascots"

const SPIN_MS = 3400

/** The coin a topic would mint: same library mascot if we have one, otherwise null. */
function coinForTopic(topic: string): DiscoverProject | null {
  const t = topic.trim()
  if (t.length < 3) return null
  const url = mascotUrl(mascotForTopic(t))
  return DISCOVER_PROJECTS.find((p) => p.mascot === url) ?? null
}

/**
 * Hero visual: the library coin renders, flipping to a new design every few seconds and to the
 * closest match while the visitor types. Tilts toward the pointer on desktop.
 */
export function CoinForge({ topic }: { topic: string }) {
  const reduce = useReducedMotion()
  const coins = useMemo(() => [...DISCOVER_PROJECTS].sort((a, b) => a.editorsPick - b.editorsPick), [])
  const [index, setIndex] = useState(0)
  const match = coinForTopic(topic)
  const current = match ?? coins[index % coins.length]

  useEffect(() => {
    if (reduce || match) return
    const id = window.setInterval(() => setIndex((i) => i + 1), SPIN_MS)
    return () => window.clearInterval(id)
  }, [reduce, match])

  // Pointer tilt (motion values, no re-renders).
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 })
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 })

  return (
    <div
      ref={ref}
      className="relative mx-auto grid aspect-square w-full max-w-[19rem] place-items-center [perspective:1200px] sm:max-w-[30rem] lg:max-w-[34rem]"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-[var(--lab)] opacity-20 blur-[90px]" />
      <div aria-hidden className="absolute bottom-[6%] h-[8%] w-[56%] rounded-[50%] bg-black/50 blur-xl" />
      <motion.div style={{ rotateX: rotX, rotateY: rotY }} className="relative size-full [transform-style:preserve-3d]">
        <motion.div
          key={current.slug}
          initial={reduce ? false : { rotateY: -90, opacity: 0.4 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          className="size-full"
        >
          {/* Float lives on its own element so it doesn't fight the flip transform. */}
          <div className="size-full motion-safe:animate-[coin-float_6s_ease-in-out_infinite]">
            <CoinImage src={current.coin} fallback={current.mascot} alt={`${current.name} coin`} size={640} priority sizes="(min-width: 1024px) 34rem, 80vw" className="size-full" />
          </div>
        </motion.div>
      </motion.div>
      <p className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background/70 px-4 py-1.5 font-mono text-sm whitespace-nowrap backdrop-blur" aria-live="polite">
        <span className="text-lab">${current.ticker}</span> <span className="text-muted-foreground">{current.domain}</span>
      </p>
    </div>
  )
}
