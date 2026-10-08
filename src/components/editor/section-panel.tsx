"use client"
import { BookOpen, ChevronRight, Coins, Eye, EyeOff, Images, PanelBottom, Plus, ScrollText, Sparkles, Tag, Trash2, Users, type LucideIcon } from "lucide-react"
import type { SiteConfig, SiteSectionId } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Segmented, TextField } from "./fields"
import { SOCIAL_KEYS, SOCIAL_LABELS, isSolanaAddress, tokenLinks } from "@/lib/site/token-links"

export type EditorSection = "brand" | SiteSectionId

export const EDITOR_SECTIONS: { id: EditorSection; label: string; icon: LucideIcon }[] = [
  { id: "brand", label: "Brand", icon: Tag },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "about", label: "About", icon: BookOpen },
  { id: "lore", label: "Lore", icon: ScrollText },
  { id: "token", label: "Token", icon: Coins },
  { id: "memes", label: "Memes", icon: Images },
  { id: "community", label: "Community", icon: Users },
  { id: "footer", label: "Footer", icon: PanelBottom },
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
                <sec.icon className="size-4 shrink-0" aria-hidden />
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
            <p className="text-xs text-muted-foreground">Change the mascot artwork in Style, under Mascot.</p>
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
              Paste your contract address once the token is live. The site then shows a Buy button, pump.fun, DexScreener, Birdeye and Solscan links, a copy button and How to buy steps. A risk notice always stays on the page.
            </p>
            <TextField label="Title" value={site.token.title} maxLength={40} onChange={(v) => set("token", { title: v })} />
            <TextField label="Network" value={site.token.network} maxLength={30} onChange={(v) => set("token", { network: v })} />
            <TextField label="Supply" value={site.token.supply} maxLength={30} onChange={(v) => set("token", { supply: v })} />
            <TextField
              label="Contract address (CA)"
              placeholder="Paste the Solana mint after launch"
              value={site.token.contract ?? ""}
              maxLength={64}
              onChange={(v) => set("token", { contract: v.trim().replace(/[^1-9A-HJ-NP-Za-km-z0-9xX]/g, "") })}
            />
            {site.token.contract && !isSolanaAddress(site.token.contract) && (
              <p className="text-xs text-destructive">That doesn&apos;t look like a Solana address (32 to 44 letters and numbers). Market links stay off until it does.</p>
            )}
            {site.token.contract && (
              <>
                <Segmented
                  label="Launched on pump.fun?"
                  value={site.token.pumpfun === false ? "no" : "yes"}
                  options={[
                    { id: "yes", label: "Yes, show link" },
                    { id: "no", label: "No" },
                  ]}
                  onChange={(v) => set("token", { pumpfun: v === "yes" })}
                />
                <Segmented
                  label="How to buy steps"
                  value={site.token.howToBuy === false ? "hide" : "show"}
                  options={[
                    { id: "show", label: "Show" },
                    { id: "hide", label: "Hide" },
                  ]}
                  onChange={(v) => set("token", { howToBuy: v === "show" })}
                />
                <TextField label="Custom buy link (optional, https://...)" placeholder="Defaults to a Jupiter swap" value={site.token.buyUrl ?? ""} maxLength={300} onChange={(v) => set("token", { buyUrl: v.trim() })} />
                <TextField label="Chart link (optional, https://...)" placeholder="Defaults to DexScreener" value={site.token.dexUrl ?? ""} maxLength={300} onChange={(v) => set("token", { dexUrl: v.trim() })} />
                <p className="text-xs text-muted-foreground">
                  Buttons on your site:{" "}
                  {(() => {
                    const l = tokenLinks(site.token, site.brand.ticker)
                    return [l.buy?.label, ...l.markets.map((m) => m.label)].filter(Boolean).join(", ") || "none yet"
                  })()}
                </p>
              </>
            )}
            <TextField label="Note" value={site.token.note} maxLength={200} onChange={(v) => set("token", { note: v })} />
          </>
        )}
        {active === "memes" && (
          <>
            <TextField label="Title" value={site.memes.title} maxLength={60} onChange={(v) => set("memes", { title: v })} />
            {site.memes.items.map((m, i) => (
              <div key={i} className="flex items-end gap-2 rounded-xl border border-border p-2.5">
                <div className="flex-1">
                  <TextField label={`Caption ${i + 1}`} value={m.caption} maxLength={160} onChange={(v) => set("memes", { items: site.memes.items.map((x, j) => (j === i ? { ...x, caption: v } : x)) })} />
                </div>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove meme ${i + 1}`} onClick={() => set("memes", { items: site.memes.items.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            {site.memes.items.length < 9 && (
              <Button variant="glass" size="sm" onClick={() => set("memes", { items: [...site.memes.items, { caption: "New meme caption" }] })}>
                <Plus /> Add meme
              </Button>
            )}
          </>
        )}
        {active === "community" && (
          <>
            <TextField label="Title" value={site.community.title} maxLength={60} onChange={(v) => set("community", { title: v })} />
            <TextField label="Subtitle" value={site.community.subtitle} maxLength={200} onChange={(v) => set("community", { subtitle: v })} />
            {SOCIAL_KEYS.map((k) => (
              <TextField
                key={k}
                label={`${SOCIAL_LABELS[k]} link (https://...)`}
                placeholder={k === "x" || k === "telegram" || k === "discord" ? "Leave empty for a placeholder" : "Optional"}
                value={(site.community.links as Record<string, string | undefined>)[k] ?? ""}
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
