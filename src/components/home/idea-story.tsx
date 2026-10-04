"use client"
import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import type { MemeConcept, SiteConfig } from "@/lib/types"
import { MascotLogo } from "@/components/shared/mascot-logo"
import { MemeSite } from "@/components/site/meme-site"
import { TestTubes } from "@/components/shared/test-tubes"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const VERBS = ["Type it", "Name it", "Badge it", "Color it", "Write the lore", "Ship the site"]

export function IdeaStory({ concept, site, topic }: { concept: MemeConcept; site: SiteConfig; topic: string }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      // Pinned, scrubbed story on large screens with motion allowed. Everything else gets the stacked layout.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const section = root.current!
        const panels = gsap.utils.toArray<HTMLElement>(".story-panel", section)
        const verbs = gsap.utils.toArray<HTMLElement>(".story-verb", section)
        section.dataset.pinned = "true"
        gsap.set(panels.slice(1), { autoAlpha: 0, y: 60, scale: 1.04 })

        const setActive = (i: number) => verbs.forEach((v, j) => v.toggleAttribute("data-active", j === i))
        setActive(0)

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", duration: 1 },
          scrollTrigger: {
            trigger: section.querySelector(".story-stage-wrap"),
            start: "top top",
            end: () => `+=${panels.length * window.innerHeight * 0.75}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => setActive(Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1)))),
          },
        })
        panels.slice(1).forEach((panel, i) => {
          tl.to(panels[i], { autoAlpha: 0, y: -50, scale: 0.94, filter: "blur(6px)" }).to(panel, { autoAlpha: 1, y: 0, scale: 1 }, "<0.25")
        })
        return () => {
          delete section.dataset.pinned
          verbs.forEach((v) => v.removeAttribute("data-active"))
        }
      })
    },
    { scope: root },
  )

  const panelBase =
    "story-panel flex min-h-[22rem] flex-col justify-center rounded-[2rem] border border-border bg-card p-6 sm:p-10 group-data-[pinned]/story:absolute group-data-[pinned]/story:inset-0"

  return (
    <section ref={root} aria-labelledby="story-title" className="group/story relative">
      <div className="story-stage-wrap mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:min-h-[100dvh] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:py-0">
        <div className="flex flex-col gap-6">
          <h2 id="story-title" className="font-heading text-4xl leading-[1] font-extrabold sm:text-5xl lg:text-6xl">
            One silly idea in. <span className="text-lab">A whole brand out.</span>
          </h2>
          <p className="max-w-md text-lg text-muted-foreground">Here is what the lab does with two words: “{topic}”.</p>
          <ol className="hidden flex-col gap-1 lg:flex" aria-label="What gets generated">
            {VERBS.map((v) => (
              <li
                key={v}
                className="story-verb group/verb flex items-center gap-3 font-heading text-xl font-bold text-muted-foreground/60 transition-colors duration-300 data-[active]:text-foreground"
              >
                <span className="h-0.5 w-6 rounded-full bg-current transition-[width,background-color] duration-300 group-data-[active]/verb:w-12 group-data-[active]/verb:bg-[var(--lab)]" />
                {v}
              </li>
            ))}
          </ol>
        </div>

        <div className="relative flex flex-col gap-4 lg:h-[34rem]">
          {/* 1. The idea */}
          <article className={panelBase}>
            <StageLabel>{VERBS[0]}</StageLabel>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-5 py-5 font-heading text-3xl font-bold sm:text-5xl">
              <span>{topic}</span>
              <span aria-hidden className="h-10 w-1 animate-pulse rounded bg-[var(--lab)] motion-reduce:animate-none" />
            </div>
          </article>

          {/* 2. Name + ticker */}
          <article className={panelBase}>
            <StageLabel>{VERBS[1]}</StageLabel>
            <p className="font-heading text-[clamp(3.5rem,9vw,7.5rem)] leading-none font-black tracking-[-0.05em] text-lab">${concept.ticker}</p>
            <p className="mt-4 text-lg text-muted-foreground">
              {concept.name} <span className="font-mono text-foreground">{concept.domain}</span>
            </p>
            <p className="mt-2 font-heading text-2xl font-bold">{concept.tagline}</p>
          </article>

          {/* 3. Logo badge */}
          <article className={panelBase}>
            <StageLabel>{VERBS[2]}</StageLabel>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="w-48 shrink-0 sm:w-60">
                <MascotLogo name={concept.name} ticker={concept.ticker} mascot={concept.mascot} colors={concept.palette.map((c) => c.hex)} />
              </div>
              <p className="text-lg text-muted-foreground">{concept.logoConcept}</p>
            </div>
          </article>

          {/* 4. Palette as test tubes */}
          <article className={panelBase}>
            <StageLabel>{VERBS[3]}</StageLabel>
            <TestTubes palette={concept.palette} />
          </article>

          {/* 5. Lore as lab notes */}
          <article className={panelBase}>
            <StageLabel>{VERBS[4]}</StageLabel>
            <ol className="grid gap-3 sm:grid-cols-2">
              {concept.lore.map((l) => (
                <li key={l.title} className="rounded-2xl bg-foreground/[0.04] p-4">
                  <p className="font-heading text-lg font-bold">{l.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
                </li>
              ))}
            </ol>
          </article>

          {/* 6. The website, live */}
          <article className={`${panelBase} justify-start overflow-hidden p-3 sm:p-3`}>
            <div className="h-full min-h-[22rem] overflow-hidden rounded-[1.5rem] border border-border">
              <div className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50">
                <MemeSite config={site} />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function StageLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 font-medium text-muted-foreground lg:hidden">{children}</p>
}
