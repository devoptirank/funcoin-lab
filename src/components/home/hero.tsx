"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { Compass } from "lucide-react"
import { toAppUrl } from "@/lib/hosts"
import { DISCOVER_PROJECTS } from "@/lib/discover"
import { CoinForge } from "./coin-forge"

gsap.registerPlugin(SplitText, useGSAP)

const EXAMPLES = ["Sleepy Cat", "Banana Boss", "Office Penguin", "Alien", "Chai", "Pixel Panda", "Space Hamster", "Wizard Frog"]

/** Split hero: the pitch and topic input on the left, the Coin Forge on the right. */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const [topic, setTopic] = useState("")

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".hero-title", { type: "chars", aria: "auto" })
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
        tl.from(split.chars, { yPercent: 70, opacity: 0, rotate: 6, duration: 0.9, stagger: 0.018 })
          .from(".hero-fade", { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.55")
          .from(".hero-visual", { scale: 0.9, opacity: 0, duration: 1.1 }, 0.1)
          .add(() => split.revert())
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  // Full page load into the app host (the wallet gate lives there).
  const go = (value: string) => {
    const q = new URLSearchParams({ auto: "1" })
    if (value.trim()) q.set("topic", value.trim().slice(0, 80))
    window.location.assign(toAppUrl(`/create?${q.toString()}`))
  }

  return (
    <section ref={root} className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] size-[46rem] rounded-full bg-[radial-gradient(closest-side,var(--violet),transparent)] [opacity:var(--glow-opacity)]" />
        <div className="absolute bottom-[-30%] left-[-15%] size-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--lab),transparent)] [opacity:calc(var(--glow-opacity)*0.3)]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6 lg:pt-6 lg:pb-12">
        <div className="relative z-10 flex min-w-0 flex-col gap-6">
          <h1 className="hero-title font-heading text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            Mint your meme into a <span className="text-lab">whole brand</span>
          </h1>
          <p className="hero-fade max-w-[32rem] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Name, coin art, <span className="font-semibold text-foreground">.fun</span> domain, lore, memes and a website, from one silly idea.
          </p>

          <form
            className="hero-fade flex max-w-xl flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              go(topic)
            }}
          >
            <label htmlFor="hero-topic" className="text-sm font-medium">
              What is your meme about?
            </label>
            <div className="glass flex flex-col gap-2 rounded-[1.75rem] p-1.5 focus-within:border-[color-mix(in_oklab,var(--lab)_55%,transparent)] sm:flex-row sm:items-center">
              <input
                id="hero-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
                placeholder="Sleepy cat, office alien, chai..."
                autoComplete="off"
                className="h-13 min-w-0 flex-1 rounded-[1.4rem] bg-transparent px-4 text-lg outline-none placeholder:text-muted-foreground/80"
              />
              <button
                type="submit"
                className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--lab)] px-6 text-base font-semibold whitespace-nowrap text-[var(--lab-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-[color-mix(in_oklab,var(--lab),white_12%)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98]"
              >
                Mint my idea
              </button>
            </div>
          </form>

          <div className="hero-fade -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Example topics">
            <ul className="flex w-max snap-x gap-2 sm:w-auto sm:flex-wrap">
              {EXAMPLES.map((ex) => (
                <li key={ex} className="snap-start">
                  <button
                    type="button"
                    onClick={() => setTopic(ex)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:border-[color-mix(in_oklab,var(--lab)_60%,transparent)] hover:text-foreground"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/discover" className="hero-fade inline-flex w-fit items-center gap-2 text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <Compass className="size-5" /> Browse {DISCOVER_PROJECTS.length} coin ideas
          </Link>
        </div>

        <div className="hero-visual">
          <CoinForge topic={topic} />
        </div>
      </div>
    </section>
  )
}
