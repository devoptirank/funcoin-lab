"use client"
import { ChevronRight, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import type { SiteConfig, SiteSectionId } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TextField } from "./fields"

export type EditorSection = "brand" | SiteSectionId

export const EDITOR_SECTIONS: { id: EditorSection; label: string; emoji: string }[] = [
  { id: "brand", label: "Brand", emoji: "🏷️" },
  { id: "hero", label: "Hero", emoji: "🦸" },
  { id: "about", label: "About", emoji: "📖" },
  { id: "lore", label: "Lore", emoji: "📜" },
  { id: "token", label: "Token concept", emoji: "🧪" },
  { id: "memes", label: "Memes", emoji: "🖼️" },
  { id: "community", label: "Community", emoji: "💬" },
  { id: "footer", label: "Footer", emoji: "🦶" },
]

type Props = {
  site: SiteConfig
  active: EditorSection
  onActive: (id: EditorSection) => void
  update: (fn: (s: SiteConfig) => SiteConfig) => void
}

export function SectionPanel({ site, active, onActive, update }: Props) {
  const set = <K extends Exclude<keyof SiteConfig, "template">>(key: K, patch: Partial<SiteConfig[K]>) => update((s) => ({ ...s, [key]: { ...s[key], ...patch } }))

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-0.5 p-2">
        {EDITOR_SECTIONS.map((sec) => {
          const visible = sec.id === "brand" || site.sections[sec.id]
          return (
            <li key={sec.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onActive(sec.id)}
                aria-current={active === sec.id}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  active === sec.id ? "bg-lab-fill font-semibold text-lab-ink" : "hover:bg-foreground/5",
                  !visible && "opacity-50",
                )}
              >
                <span aria-hidden>{sec.emoji}</span>
                <span className="flex-1">{sec.label}</span>
                <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", active === sec.id && "rotate-90")} />
              </button>
              {sec.id !== "brand" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${visible ? "Hide" : "Show"} ${sec.label}`}
                  onClick={() => update((s) => ({ ...s, sections: { ...s.sections, [sec.id]: !s.sections[sec.id as SiteSectionId] } }))}
                >
                  {visible ? <Eye /> : <EyeOff />}
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        {active === "brand" && (
          <>
            <TextField label="Name" value={site.brand.name} maxLength={60} onChange={(v) => set("brand", { name: v })} />
            <TextField label="Ticker concept" value={site.brand.ticker} maxLength={10} onChange={(v) => set("brand", { ticker: v.toUpperCase().replace(/[^A-Z0-9]/g, "") })} />
            <TextField label=".fun domain idea" value={site.brand.domain} maxLength={70} onChange={(v) => set("brand", { domain: v.toLowerCase().replace(/\s/g, "") })} />
            <TextField label="Mascot emoji" value={site.brand.mascot} maxLength={8} onChange={(v) => set("brand", { mascot: v })} />
          </>
        )}
        {active === "hero" && (
          <>
            <TextField label="Headline" value={site.hero.headline} maxLength={90} onChange={(v) => set("hero", { headline: v })} />
            <TextField label="Subheadline" value={site.hero.subheadline} maxLength={160} onChange={(v) => set("hero", { subheadline: v })} />
            <TextField label="Quote" value={site.hero.quote} maxLength={100} onChange={(v) => set("hero", { quote: v })} />
            <TextField label="Primary button" value={site.hero.primaryCta} maxLength={24} onChange={(v) => set("hero", { primaryCta: v })} />
            <TextField label="Secondary button" value={site.hero.secondaryCta} maxLength={24} onChange={(v) => set("hero", { secondaryCta: v })} />
          </>
        )}
        {active === "about" && (
          <>
            <TextField label="Title" value={site.about.title} maxLength={60} onChange={(v) => set("about", { title: v })} />
            <TextField label="Body (blank line = new paragraph)" multiline value={site.about.body} maxLength={1500} onChange={(v) => set("about", { body: v })} />
          </>
        )}
        {active === "lore" && (
          <>
            <TextField label="Title" value={site.lore.title} maxLength={60} onChange={(v) => set("lore", { title: v })} />
            {site.lore.steps.map((step, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Chapter {i + 1}</span>
                  <Button variant="ghost" size="icon-xs" aria-label={`Remove chapter ${i + 1}`} disabled={site.lore.steps.length <= 1} onClick={() => set("lore", { steps: site.lore.steps.filter((_, j) => j !== i) })}>
                    <Trash2 />
                  </Button>
                </div>
                <TextField label="Title" value={step.title} maxLength={60} onChange={(v) => set("lore", { steps: site.lore.steps.map((s, j) => (j === i ? { ...s, title: v } : s)) })} />
                <TextField label="Text" multiline value={step.text} maxLength={300} onChange={(v) => set("lore", { steps: site.lore.steps.map((s, j) => (j === i ? { ...s, text: v } : s)) })} />
              </div>
            ))}
            {site.lore.steps.length < 8 && (
              <Button variant="glass" size="sm" onClick={() => set("lore", { steps: [...site.lore.steps, { title: "A new chapter", text: "Something ridiculous happens." }] })}>
                <Plus /> Add chapter
              </Button>
            )}
          </>
        )}
        {active === "token" && (
          <>
            <p className="rounded-lg bg-foreground/5 p-2.5 text-xs text-muted-foreground">
              Add the contract address once your token is live. The site always shows a risk notice, and never shows prices or buy buttons.
            </p>
            <TextField label="Title" value={site.token.title} maxLength={40} onChange={(v) => set("token", { title: v })} />
            <TextField label="Network" value={site.token.network} maxLength={30} onChange={(v) => set("token", { network: v })} />
            <TextField label="Supply" value={site.token.supply} maxLength={30} onChange={(v) => set("token", { supply: v })} />
            <TextField
              label="Contract address (optional)"
              placeholder="Paste after launch"
              value={site.token.contract ?? ""}
              maxLength={64}
              onChange={(v) => set("token", { contract: v.trim().replace(/[^1-9A-HJ-NP-Za-km-z0-9xX]/g, "") })}
            />
            <TextField label="Note" value={site.token.note} maxLength={200} onChange={(v) => set("token", { note: v })} />
          </>
        )}
        {active === "memes" && (
          <>
            <TextField label="Title" value={site.memes.title} maxLength={60} onChange={(v) => set("memes", { title: v })} />
            {site.memes.items.map((m, i) => (
              <div key={i} className="flex gap-2 rounded-xl border border-border p-2.5">
                <div className="w-14 shrink-0">
                  <TextField label="Emoji" value={m.emoji} maxLength={8} onChange={(v) => set("memes", { items: site.memes.items.map((x, j) => (j === i ? { ...x, emoji: v } : x)) })} />
                </div>
                <div className="flex-1">
                  <TextField label={`Caption ${i + 1}`} value={m.caption} maxLength={160} onChange={(v) => set("memes", { items: site.memes.items.map((x, j) => (j === i ? { ...x, caption: v } : x)) })} />
                </div>
                <Button variant="ghost" size="icon-xs" className="self-end" aria-label={`Remove meme ${i + 1}`} onClick={() => set("memes", { items: site.memes.items.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            {site.memes.items.length < 9 && (
              <Button variant="glass" size="sm" onClick={() => set("memes", { items: [...site.memes.items, { emoji: site.brand.mascot, caption: "New meme caption" }] })}>
                <Plus /> Add meme
              </Button>
            )}
          </>
        )}
        {active === "community" && (
          <>
            <TextField label="Title" value={site.community.title} maxLength={60} onChange={(v) => set("community", { title: v })} />
            <TextField label="Subtitle" value={site.community.subtitle} maxLength={200} onChange={(v) => set("community", { subtitle: v })} />
            {(["x", "telegram", "discord"] as const).map((k) => (
              <TextField
                key={k}
                label={`${{ x: "X / Twitter", telegram: "Telegram", discord: "Discord" }[k]} link (https://…)`}
                placeholder="Leave empty for a placeholder"
                value={site.community.links[k]}
                maxLength={200}
                onChange={(v) => set("community", { links: { ...site.community.links, [k]: v.trim() } })}
              />
            ))}
          </>
        )}
        {active === "footer" && <TextField label="Footer text" multiline value={site.footer.text} maxLength={300} onChange={(v) => set("footer", { text: v })} />}
      </div>
    </div>
  )
}
