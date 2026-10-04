"use client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const MESSAGES = [
  "Mixing chaos with good vibes",
  "Teaching the mascot to pose",
  "Inventing suspiciously specific lore",
  "Picking a palette with main-character energy",
  "Workshopping the catchphrase",
  "Building the .fun website",
]

/** A test tube filling while the concept brews. The skeleton below mirrors the lab report layout. */
export function GeneratingState({ topic }: { topic: string }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 1600)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-8 rounded-[2rem] border border-border bg-card p-8 sm:flex-row sm:p-12">
        <div aria-hidden className="relative flex h-48 w-16 shrink-0 flex-col justify-end overflow-hidden rounded-t-xl rounded-b-full border-2 border-border bg-foreground/[0.04]">
          <div className="relative w-full rounded-b-full bg-[var(--lab)] [animation:tube-fill_6s_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:h-1/2 motion-reduce:animate-none">
            {[0, 1, 2].map((b) => (
              <span
                key={b}
                className="absolute bottom-2 size-2 rounded-full bg-white/70 motion-reduce:hidden"
                style={{ left: `${25 + b * 22}%`, animation: `tube-bubble 1.6s ease-in ${b * 0.45}s infinite` }}
              />
            ))}
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="font-heading text-3xl font-extrabold sm:text-4xl">{topic ? `Brewing “${topic}”` : "Brewing something ridiculous"}</p>
          <p className="mt-2 text-lg text-muted-foreground">{MESSAGES[i]}...</p>
        </div>
      </div>
      <div className="grid gap-6 rounded-[2rem] border border-border p-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Skeleton className="h-80 rounded-[2rem]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-2/3 rounded-xl" />
          <Skeleton className="h-6 w-1/2 rounded-xl" />
          <Skeleton className="h-10 w-5/6 rounded-xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
