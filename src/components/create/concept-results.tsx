"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AtSign, Check, Expand, Globe, Images, LayoutTemplate, Loader2, Megaphone, MonitorSmartphone, Palette, PencilLine, RefreshCw, Rocket, Save, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import type { MemeConcept } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/shared/copy-button"
import { ConceptDisclaimer, FictionalBadge } from "@/components/shared/fictional-badge"
import { MascotLogo } from "@/components/shared/mascot-logo"
import { SpecimenJar } from "@/components/shared/specimen-jar"
import { TestTubes } from "@/components/shared/test-tubes"
import { namingLabel, personalityLabel, themeLabel } from "@/lib/generator/concept"
import { burst } from "@/lib/burst"
import { BrowserFrame } from "@/components/home/site-showcase"
import { MemeSite } from "@/components/site/meme-site"
import { LogoStudio } from "@/components/tools/logo-studio"
import { BrandKit } from "@/components/tools/brand-kit"
import { DomainFinder } from "@/components/tools/domain-finder"
import { MemeGallery } from "@/components/tools/meme-gallery"
import { SocialBios } from "@/components/tools/social-bios"
import { ContentGenerator } from "@/components/tools/content-generator"
import { useStore } from "@/components/providers/store-provider"
import { newProject } from "@/lib/store/repo"
import { conceptToSite } from "@/lib/generator/site"
import { cn } from "@/lib/utils"

const NAV = [
  { id: "brand", label: "Brand" },
  { id: "logo", label: "Logo" },
  { id: "kit", label: "Brand Kit" },
  { id: "domains", label: ".fun Domains" },
  { id: "website", label: "Website" },
  { id: "memes", label: "Memes" },
  { id: "social", label: "Social" },
  { id: "content", label: "Content" },
  { id: "launch", label: "Launch ideas" },
]

export function conceptToMarkdown(c: MemeConcept) {
  return `# ${c.name} ($${c.ticker})
${c.tagline}

- Domain idea: ${c.domain}
- Personality: ${c.traits.join(" • ")}
- Slogan: “${c.slogan}”
- Catchphrase: “${c.catchphrase}”
- Community phrases: ${c.communityPhrases.map((p) => `“${p}”`).join(", ")}

## Origin story
${c.originStory}

## Lore
${c.lore.map((l, i) => `${i + 1}. ${l.title}: ${l.text}`).join("\n")}

## Logo concept
${c.logoConcept}
Palette: ${c.palette.map((p) => `${p.name} ${p.hex}`).join(", ")}

## Website
Headline: ${c.websiteHeadline}
Description: ${c.websiteDescription}

## Social bio
${c.socialBio}

## Meme ideas
${c.memeIdeas.map((m) => `- ${m}`).join("\n")}

## Launch-content ideas
${c.launchIdeas.map((m) => `- ${m}`).join("\n")}

---
Made with FunCoin Lab. Not financial advice.
`
}

export function ConceptResults({
  concept,
  goal,
  onRegenerate,
  onEdit,
}: {
  concept: MemeConcept
  goal?: string | null
  onRegenerate: () => void
  onEdit: () => void
  onChange?: (c: MemeConcept) => void
}) {
  const router = useRouter()
  const { repo } = useStore()
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const site = useMemo(() => conceptToSite(concept), [concept])

  const save = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    const button = e?.currentTarget ?? null
    if (savedId === concept.id) return concept.id
    setSaving(true)
    try {
      const p = await repo.saveProject(newProject(concept, site))
      setSavedId(p.id)
      burst(button)
      toast.success("Saved to your dashboard")
      return p.id
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save")
      return null
    } finally {
      setSaving(false)
    }
  }

  const openBuilder = async () => {
    const id = await save()
    if (id) router.push(`/editor/${id}`)
  }

  const saved = savedId === concept.id

  return (
    <div className="flex flex-col gap-10">
      {/* Action bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FictionalBadge />
          {concept.source === "local" && <span className="text-xs text-muted-foreground">Generated with built-in templates</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="lg" onClick={onEdit}>
            <PencilLine /> Edit inputs
          </Button>
          <Button variant="glass" size="lg" onClick={onRegenerate}>
            <RefreshCw /> Regenerate
          </Button>
          <CopyButton text={conceptToMarkdown(concept)} label="Copy all" size="default" />
          <Button variant="glass" size="lg" onClick={(e) => save(e)} disabled={saving || saved}>
            {saving ? <Loader2 className="animate-spin" /> : saved ? <Check className="text-lab" /> : <Save />} {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="glow" size="lg" className="px-4" onClick={openBuilder}>
            <LayoutTemplate /> Website Builder
          </Button>
        </div>
      </div>

      {/* Section nav */}
      <nav aria-label="Result sections" className="sticky top-16 z-30 -mx-4 overflow-x-auto bg-background/80 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:rounded-full sm:px-2">
        <ul className="flex w-max gap-1">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="block rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* LAB REPORT: the brand profile */}
      <section id="brand" aria-labelledby="report-title" className="lab-pour scroll-mt-32">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-popover">
          {/* Recipe strip: the real inputs that produced this concept */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-border px-6 py-4 text-sm sm:grid-cols-3 lg:grid-cols-6 sm:px-8">
            {[
              ["Idea", concept.input.topic || "Surprise me"],
              ["Theme", themeLabel(concept.input.theme)],
              ["Personality", personalityLabel(concept.input.personality)],
              ["Naming", namingLabel(concept.input.namingStyle)],
              ["Engine", concept.source === "ai" ? "AI" : "Templates"],
              ["Mixed", new Date(concept.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-8">
              <SpecimenJar>
                <MascotLogo name={concept.name} ticker={concept.ticker} mascot={concept.mascot} colors={concept.palette.map((p) => p.hex)} animated />
              </SpecimenJar>
              <div>
                <TestTubes palette={concept.palette} size="sm" />
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {concept.palette.map((c) => (
                    <CopyButton key={c.hex} text={c.hex} label={c.name} variant="ghost" size="xs" />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <div>
                <h2 id="report-title" className="font-heading text-[clamp(3.25rem,8vw,6.5rem)] leading-[0.9] font-black tracking-[-0.05em] break-words text-lab">
                  ${concept.ticker}
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  {concept.name} <span className="font-mono text-foreground">{concept.domain}</span>
                </p>
              </div>
              <p className="font-heading text-2xl leading-snug font-bold sm:text-3xl">{concept.tagline}</p>
              <ul className="flex flex-wrap gap-2" aria-label="Personality">
                {concept.traits.map((t) => (
                  <li key={t} className="rounded-full border border-border px-3 py-1 text-sm">
                    {t}
                  </li>
                ))}
              </ul>
              <blockquote className="border-l-4 border-lab-fill pl-4 font-heading text-xl font-bold sm:text-2xl">“{concept.slogan}”</blockquote>

              {/* Lab notes: ruled notebook paper for the lore */}
              <figure className="relative rounded-2xl border border-border bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,color-mix(in_oklab,var(--foreground)_8%,transparent)_31px,color-mix(in_oklab,var(--foreground)_8%,transparent)_32px)] py-[6px] pr-5 pl-12">
                <span aria-hidden className="absolute inset-y-0 left-8 w-px bg-[color-mix(in_oklab,var(--destructive)_45%,transparent)]" />
                <figcaption className="font-heading text-lg leading-8 font-bold">Lab notes</figcaption>
                <p className="leading-8 text-foreground/85">{concept.originStory}</p>
              </figure>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Catchphrase</h3>
                  <p className="text-lg italic">“{concept.catchphrase}”</p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Community says</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {concept.communityPhrases.map((p) => (
                      <li key={p}>“{p}”</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <dl className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Meme coin name", concept.name],
              ["Ticker concept", `$${concept.ticker}`],
              [".fun domain idea", concept.domain],
              ["One-line description", concept.tagline],
              ["Website headline", concept.websiteHeadline],
              ["Website description", concept.websiteDescription],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 bg-popover p-5">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-semibold break-words">{v}</dd>
                </div>
                <CopyButton text={v} size="icon-sm" variant="ghost" />
              </div>
            ))}
          </dl>
          <ConceptDisclaimer className="border-t border-border px-6 py-4 sm:px-8" />
        </div>
      </section>

      <ResultSection id="logo" title="AI Logo Concept" icon={Palette}>
        <LogoStudio concept={concept} />
      </ResultSection>

      <ResultSection id="kit" title="AI Brand Kit" icon={Images}>
        <BrandKit concept={concept} />
      </ResultSection>

      <ResultSection id="domains" title="Find Your .fun Name" icon={Globe}>
        <DomainFinder initialTopic={concept.name} autoRun compact />
      </ResultSection>

      <ResultSection
        id="website"
        title="Your .fun Website Preview"
        icon={MonitorSmartphone}
        highlight={goal === "website"}
        action={
          <div className="flex gap-2">
            <Button variant="glass" size="lg" onClick={async () => {
              const id = await save()
              if (id) window.open(`/preview/${id}`, "_blank", "noopener")
            }}>
              <Expand /> Full preview
            </Button>
            <Button variant="glow" size="lg" className="px-4" onClick={openBuilder}>
              <LayoutTemplate /> Customize
            </Button>
          </div>
        }
      >
        <BrowserFrame url={concept.domain}>
          <div className="h-[620px] overflow-y-auto overscroll-contain">
            <MemeSite config={site} />
          </div>
        </BrowserFrame>
      </ResultSection>

      <ResultSection id="memes" title="Meme Gallery" icon={Images}>
        <MemeGallery concept={concept} />
      </ResultSection>

      <ResultSection id="social" title="Social Bios" icon={AtSign}>
        <SocialBios concept={concept} />
      </ResultSection>

      <ResultSection id="content" title="Meme Content Generator" icon={Megaphone}>
        <ContentGenerator concept={concept} />
      </ResultSection>

      <ResultSection id="launch" title="Meme & Launch-Content Ideas" icon={Rocket}>
        <div className="grid gap-4 md:grid-cols-2">
          <IdeaList title="Meme ideas" items={concept.memeIdeas} />
          <IdeaList title="Launch-content ideas" items={concept.launchIdeas} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Launch ideas are creative content suggestions, not marketing for any financial product.</p>
      </ResultSection>
    </div>
  )
}

function ResultSection({
  id,
  title,
  icon: Icon,
  action,
  highlight,
  children,
}: {
  id: string
  title: string
  icon: LucideIcon
  action?: React.ReactNode
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn("scroll-mt-32", highlight && "rounded-[2rem] ring-2 ring-lab-fill/60 ring-offset-8 ring-offset-background")}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-heading text-2xl font-extrabold sm:text-3xl">
          <span className="grid size-10 place-items-center rounded-xl bg-lab-fill text-lab-ink" aria-hidden>
            <Icon className="size-5" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function IdeaList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start justify-between gap-3 rounded-2xl bg-foreground/[0.03] p-3 text-sm">
            <span>{item}</span>
            <CopyButton text={item} size="icon-sm" variant="ghost" />
          </li>
        ))}
      </ul>
    </div>
  )
}
