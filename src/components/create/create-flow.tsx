"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Dices, Eye, Flame, Gem, HandHeart, Heart, Laugh, PenLine, Rocket, Shapes, Sparkles, Zap, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import {
  NAMING_STYLES,
  PERSONALITIES,
  THEMES,
  type ConceptInput,
  type MemeConcept,
  type NamingStyleId,
  type PersonalityId,
  type ThemeId,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptionPill } from "@/components/shared/option-pill"
import { useStore } from "@/components/providers/store-provider"
import { setCurrentConcept } from "@/lib/store/current"
import { newProject } from "@/lib/store/repo"
import { postJSON } from "@/lib/client-api"
import { namingLabel, personalityLabel, themeLabel } from "@/lib/generator/concept"
import { cn } from "@/lib/utils"
import { ConceptResults } from "./concept-results"
import { GeneratingState } from "./generating-state"

const STEPS = ["Theme", "Personality", "Naming", "Generate"] as const

const PERSONALITY_ICONS: Record<PersonalityId, LucideIcon> = {
  cute: Heart,
  chaotic: Zap,
  absurd: Shapes,
  funny: Laugh,
  luxury: Gem,
  genz: Sparkles,
  weird: Eye,
  aggressive: Flame,
  wholesome: HandHeart,
  random: Dices,
}

const pickParam = <T extends string>(value: string | null, list: readonly { id: T }[], fallback: T): T =>
  list.some((x) => x.id === value) ? (value as T) : fallback

export function CreateFlow() {
  const params = useSearchParams()
  const { repo, ready } = useStore()
  const [step, setStep] = useState(0)
  const [topic, setTopic] = useState(params.get("topic")?.slice(0, 80) ?? "")
  const [theme, setTheme] = useState<ThemeId>(pickParam(params.get("theme"), THEMES, params.get("topic") ? "custom" : "random"))
  const [personality, setPersonality] = useState<PersonalityId>(pickParam(params.get("personality"), PERSONALITIES, "random"))
  const [namingStyle, setNamingStyle] = useState<NamingStyleId>(pickParam(params.get("style"), NAMING_STYLES, "oneword"))
  const projectId = params.get("project")
  const autoStart = !projectId && (params.get("auto") === "1" || Boolean(params.get("topic") && params.get("theme")))
  const [loading, setLoading] = useState(Boolean(projectId) || autoStart)
  const [concept, setConcept] = useState<MemeConcept | null>(null)
  const autoRan = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  // Only touches state after the request resolves, so it's safe to start from an effect.
  const runGeneration = useCallback(
    async (input: ConceptInput) => {
      try {
        const res = await postJSON<{ concept: MemeConcept; source: string }>("/api/generate/concept", input)
        setConcept(res.concept)
        setCurrentConcept(res.concept)
        repo.recordIdea(res.concept).catch(() => {})
        // Every idea lands in the dashboard right away; "Save" / "Build website" later adds the site.
        repo.saveProject(newProject(res.concept, null)).catch((e: unknown) => {
          toast.error("Couldn't save this idea to your dashboard", { description: e instanceof Error ? e.message : undefined })
        })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Generation failed")
      } finally {
        setLoading(false)
      }
    },
    [repo],
  )

  const generate = (overrides?: Partial<ConceptInput>) => {
    const input = { topic: topic.trim(), theme, personality, namingStyle, ...overrides }
    if (input.theme === "custom" && !input.topic) {
      toast.error("Tell us what your meme is about (or pick a theme).")
      setStep(0)
      return
    }
    setLoading(true)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    runGeneration(input)
  }

  // Dashboard links open a saved project's results directly.
  useEffect(() => {
    if (!projectId || !ready) return
    repo
      .getProject(projectId)
      .then((p) => {
        if (p) {
          setConcept(p.concept)
          setCurrentConcept(p.concept)
          setTopic(p.concept.input.topic)
          setTheme(p.concept.input.theme)
          setPersonality(p.concept.input.personality)
          setNamingStyle(p.concept.input.namingStyle)
        } else toast.error("Project not found")
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [projectId, ready, repo])

  // Homepage hero and "Remix" links can jump straight to results.
  useEffect(() => {
    if (autoRan.current || !autoStart) return
    autoRan.current = true
    runGeneration({ topic: topic.trim(), theme, personality, namingStyle })
    // Runs once on mount with the initial URL-derived inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, runGeneration])

  if (loading) return <GeneratingState topic={topic} />

  if (concept) {
    return (
      <div ref={topRef}>
        <ConceptResults
          concept={concept}
          goal={params.get("goal")}
          onRegenerate={() => generate({ seed: undefined })}
          onEdit={() => {
            setConcept(null)
            setStep(0)
          }}
          onChange={setConcept}
        />
      </div>
    )
  }

  const canNext = step !== 0 || theme !== "custom" || topic.trim().length > 0

  return (
    <div ref={topRef} className="w-full max-w-4xl">
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Generator steps">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => (i <= step || canNext ? setStep(i) : undefined)}
              className="group flex w-full flex-col gap-2 text-left"
              aria-current={i === step ? "step" : undefined}
            >
              <span className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-lab-fill" : "bg-foreground/10")} />
              <span className={cn("text-xs font-medium sm:text-sm", i === step ? "text-foreground" : "text-muted-foreground")}>
                <span className="hidden sm:inline">{i + 1}. </span>
                {label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <StepShell title="Choose a theme" subtitle="Pick a world for your meme, or describe your own idea.">
              <div className="mb-6">
                <label htmlFor="topic" className="mb-2 block text-sm font-semibold">
                  What is your meme about? <span className="font-normal text-muted-foreground">(optional unless you pick Custom)</span>
                </label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value)
                    if (e.target.value && theme === "random") setTheme("custom")
                  }}
                  maxLength={80}
                  placeholder="Angry Cat, Office Worker, Chai, Alien…"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {THEMES.map((t) => (
                  <OptionPill key={t.id} selected={theme === t.id} onClick={() => setTheme(t.id)} art={"art" in t ? t.art : undefined} icon={"art" in t ? undefined : PenLine} label={t.label} />
                ))}
              </div>
            </StepShell>
          )}
          {step === 1 && (
            <StepShell title="Choose a personality" subtitle="How does your mascot behave in the group chat?">
              <div role="radiogroup" aria-label="Personality" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {PERSONALITIES.map((p) => (
                  <OptionPill key={p.id} selected={personality === p.id} onClick={() => setPersonality(p.id)} icon={PERSONALITY_ICONS[p.id]} label={p.label} />
                ))}
              </div>
            </StepShell>
          )}
          {step === 2 && (
            <StepShell title="Choose a naming style" subtitle="The shape of the name. The generator handles the rest.">
              <div role="radiogroup" aria-label="Naming style" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NAMING_STYLES.map((n) => (
                  <OptionPill key={n.id} selected={namingStyle === n.id} onClick={() => setNamingStyle(n.id)} label={n.label} hint={`e.g. ${n.example}`} />
                ))}
              </div>
            </StepShell>
          )}
          {step === 3 && (
            <StepShell title="Ready to generate" subtitle="Here's the recipe. Hit the button and let the lab do its thing.">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Idea", topic.trim() || "Surprise me"],
                  ["Theme", themeLabel(theme)],
                  ["Personality", personalityLabel(personality)],
                  ["Naming style", namingLabel(namingStyle)],
                ].map(([k, v], i) => (
                  <button key={k} type="button" onClick={() => setStep(i === 0 ? 0 : i - 1)} className="glass rounded-2xl p-4 text-left hover:border-lab-fill/60">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-lg font-semibold">{v}</dd>
                  </button>
                ))}
              </dl>
              <p className="mt-5 text-sm text-muted-foreground">
                You&apos;ll get: name, ticker concept, .fun domain, one-liner, personality, origin story, slogan, catchphrase, logo concept, palette, social bio, website
                headline & description, meme ideas and launch-content ideas.
              </p>
            </StepShell>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" size="xl" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft /> Back
        </Button>
        {step < 3 ? (
          <Button variant="glow" size="xl" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next <ArrowRight />
          </Button>
        ) : (
          <Button variant="glow" size="xl" onClick={() => generate()}>
            <Rocket /> Generate my meme brand
          </Button>
        )}
      </div>
    </div>
  )
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <p className="mt-1 mb-6 text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  )
}
