"use client"
import { toAppUrl } from "@/lib/hosts"
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { ArrowRight, Compass } from "lucide-react"
import { ButtonLink } from "@/components/shared/button-link"
import { boilOver, setLabTopic } from "./lab-store"

gsap.registerPlugin(SplitText, useGSAP)

const FlaskScene = dynamic(() => import("./flask-scene"), { ssr: false })

const EXAMPLES = ["Angry Cat", "Sleepy Dog", "Office Worker", "Alien", "Banana", "AI Robot", "Chai", "Football", "Internet Culture"]

function canUseWebGL() {
  try {
    const c = document.createElement("canvas")
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}

export function Hero() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === "light" ? "light" : "dark"
  const root = useRef<HTMLElement>(null)
  const magnet = useRef<HTMLButtonElement>(null)
  const [topic, setTopic] = useState("")
  const [mountScene, setMountScene] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)

  // Load the 3D scene after first paint, only where it can run and motion is welcome.
  useEffect(() => {
    // Live 3D only on large, fine-pointer screens; phones and tablets keep the static poster.
    const capable = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches
    if (!capable || !canUseWebGL()) return
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const id = idle(() => setMountScene(true))
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number)
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".hero-title", { type: "chars", aria: "auto" })
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
        tl.from(split.chars, { yPercent: 70, opacity: 0, rotate: 6, duration: 0.9, stagger: 0.018 })
          .from(".hero-fade", { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.55")
          .from(".hero-visual", { scale: 0.92, opacity: 0, duration: 1.1 }, 0.1)
          .add(() => split.revert())
      })

      // Magnetic primary button (fine pointers only).
      mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
        const el = magnet.current
        if (!el) return
        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" })
        const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25)
          yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
        }
        const leave = () => {
          xTo(0)
          yTo(0)
        }
        el.addEventListener("pointermove", move)
        el.addEventListener("pointerleave", leave)
        return () => {
          el.removeEventListener("pointermove", move)
          el.removeEventListener("pointerleave", leave)
        }
      })
    },
    { scope: root },
  )

  const go = (value: string) => {
    const q = new URLSearchParams({ auto: "1" })
    if (value.trim()) q.set("topic", value.trim().slice(0, 80))
    const href = toAppUrl(`/create?${q.toString()}`)
    if (!sceneReady) return router.push(href)
    setLabTopic(value)
    boilOver()
    window.setTimeout(() => router.push(href), 650)
  }

  return (
    <section ref={root} className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] size-[46rem] rounded-full bg-[var(--violet)] blur-[160px] [opacity:var(--glow-opacity)]" />
        <div className="absolute bottom-[-30%] left-[-15%] size-[30rem] rounded-full bg-[var(--lab)] blur-[170px] [opacity:calc(var(--glow-opacity)*0.3)]" />
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-6 px-4 pt-10 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-4 lg:pt-6">
        <div className="relative z-10 flex min-w-0 flex-col gap-6">
          <h1 className="hero-title font-heading text-[clamp(2.75rem,7.2vw,5.6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            <span className="wobble-word">Create</span> <span className="wobble-word">Your</span> <span className="wobble-word">Next</span>{" "}
            <span className="wobble-word text-lab">Meme</span> <span className="wobble-word text-lab">Coin</span> <span className="wobble-word">Brand</span>
          </h1>
          <p className="hero-fade max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Generate a ridiculous name, memorable <span className="font-semibold text-foreground">.fun</span> domain, viral lore, visual identity, and
            launch-ready website concept in seconds.
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
                onChange={(e) => {
                  setTopic(e.target.value)
                  setLabTopic(e.target.value)
                }}
                maxLength={80}
                placeholder="Sleepy cat, office alien, chai..."
                autoComplete="off"
                className="h-13 min-w-0 flex-1 rounded-[1.4rem] bg-transparent px-4 text-lg outline-none placeholder:text-muted-foreground/70"
              />
              <button
                ref={magnet}
                type="submit"
                className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-[1.4rem] bg-[var(--lab)] px-6 text-base font-semibold text-[var(--lab-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-[color-mix(in_oklab,var(--lab),white_12%)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98]"
              >
                Generate Idea
              </button>
            </div>
          </form>

          <div className="hero-fade -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Example topics">
            <ul className="flex w-max snap-x gap-2 sm:w-auto sm:flex-wrap">
              {EXAMPLES.map((ex) => (
                <li key={ex} className="snap-start">
                  <button
                    type="button"
                    onClick={() => {
                      setTopic(ex)
                      go(ex)
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:border-[color-mix(in_oklab,var(--lab)_60%,transparent)] hover:text-foreground"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-fade flex flex-wrap items-center gap-x-5 gap-y-3">
            <ButtonLink href="/create" variant="glass" size="xl">
              Create My Meme Coin <ArrowRight />
            </ButtonLink>
            <Link href="/discover" className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              <Compass className="size-5" /> Explore Ideas
            </Link>
          </div>
        </div>

        <div className="hero-visual relative mx-auto aspect-square w-full max-w-[34rem] lg:max-w-none">
          <Image
            src={theme === "light" ? "/hero-flask-light.png" : "/hero-flask.png"}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 90vw"
            className={`object-contain transition-opacity duration-700 ${sceneReady ? "opacity-0" : "opacity-100"}`}
          />
          {mountScene && (
            <FlaskScene
              key={theme}
              theme={theme}
              onReady={() => setSceneReady(true)}
              className={`absolute inset-0 transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}
            />
          )}
        </div>
      </div>
    </section>
  )
}
