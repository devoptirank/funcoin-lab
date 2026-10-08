"use client"
import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SettingValue } from "@/lib/settings"
import { SettingForm, inputCls, labelCls } from "./setting-form"

/** Client forms for each runtime setting. Validation is repeated on the server with the Zod schema. */

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const num = (v: string) => (v.trim() === "" ? NaN : Number(v))

function NumberField({ label, value, onChange, min = 0, max, step = 1, hint }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; hint?: string }) {
  return (
    <label className={labelCls}>
      <span className="font-medium">{label}</span>
      <input className={inputCls} type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isNaN(value) ? "" : value} onChange={(e) => onChange(num(e.target.value))} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 accent-[var(--lab)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}

/* Pricing */

type Pricing = SettingValue<"pricing">
type Pack = Pricing["packs"][number]
const COST_LABELS: Record<keyof Pricing["imageCosts"], string> = { logo: "AI logo", mascot: "Mascot pose", meme: "Meme image", banner: "Banner", "site-hero": "Website hero art" }

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)

export function PricingForm({ initial, canWrite }: { initial: Pricing; canWrite: boolean }) {
  const [v, setV] = useState<Pricing>(initial)
  const setPack = (i: number, patch: Partial<Pack>) => setV((p) => ({ ...p, packs: p.packs.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  const addPack = () =>
    setV((p) => {
      let n = p.packs.length + 1
      while (p.packs.some((x) => x.id === `pack-${n}`)) n++
      return { ...p, packs: [...p.packs, { id: `pack-${n}`, name: `Pack ${n}`, credits: 100, usd: 10, tagline: "" }] }
    })

  const getValue = () => {
    if (!v.packs.length) return { error: "Add at least one pack." }
    for (const p of v.packs) {
      if (!p.name.trim()) return { error: "Every pack needs a name." }
      if (!Number.isInteger(p.credits) || p.credits < 1) return { error: `${p.name}: credits must be a whole number of at least 1.` }
      if (!(p.usd >= 0.5)) return { error: `${p.name}: the price must be at least $0.50.` }
    }
    if (new Set(v.packs.map((p) => p.id)).size !== v.packs.length) return { error: "Each pack id must be unique." }
    for (const [k, c] of Object.entries(v.imageCosts)) if (!Number.isInteger(c) || c < 0) return { error: `Image cost for ${k} must be a whole number.` }
    if (!Number.isInteger(v.welcomeCredits) || v.welcomeCredits < 0) return { error: "Welcome credits must be a whole number." }
    return { ...v, packs: v.packs.map((p) => ({ ...p, name: p.name.trim(), tagline: p.tagline.trim(), best: p.best || undefined })) }
  }

  return (
    <SettingForm settingKey="pricing" getValue={getValue} canWrite={canWrite} dirty={!same(v, initial)} note="Saving pricing asks your wallet to sign the change. New prices apply to new orders only.">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Credit packs</p>
        {v.packs.map((p, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_6rem_6rem_auto]">
            <label className={labelCls}>
              <span className="text-xs text-muted-foreground">Name</span>
              <input className={inputCls} maxLength={30} value={p.name} onChange={(e) => setPack(i, { name: e.target.value })} />
            </label>
            <label className={labelCls}>
              <span className="text-xs text-muted-foreground">Id (used in orders)</span>
              <input className={`${inputCls} font-mono`} maxLength={24} value={p.id} onChange={(e) => setPack(i, { id: slug(e.target.value) })} />
            </label>
            <label className={labelCls}>
              <span className="text-xs text-muted-foreground">Credits</span>
              <input className={inputCls} type="number" min={1} step={1} value={Number.isNaN(p.credits) ? "" : p.credits} onChange={(e) => setPack(i, { credits: num(e.target.value) })} />
            </label>
            <label className={labelCls}>
              <span className="text-xs text-muted-foreground">USD</span>
              <input className={inputCls} type="number" min={0.5} step={0.01} value={Number.isNaN(p.usd) ? "" : p.usd} onChange={(e) => setPack(i, { usd: num(e.target.value) })} />
            </label>
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="sm" className="h-9" aria-label={`Remove ${p.name}`} disabled={v.packs.length <= 1} onClick={() => setV((x) => ({ ...x, packs: x.packs.filter((_, j) => j !== i) }))}>
                <Trash2 />
              </Button>
            </div>
            <label className={`${labelCls} sm:col-span-4`}>
              <span className="text-xs text-muted-foreground">Tagline</span>
              <input className={inputCls} maxLength={80} value={p.tagline} onChange={(e) => setPack(i, { tagline: e.target.value })} />
            </label>
            <div className="flex items-end pb-2">
              <Toggle label="Best value" checked={Boolean(p.best)} onChange={(b) => setV((x) => ({ ...x, packs: x.packs.map((y, j) => ({ ...y, best: j === i ? b : b ? false : y.best })) }))} />
            </div>
          </div>
        ))}
        <div>
          <Button type="button" variant="outline" size="sm" onClick={addPack} disabled={v.packs.length >= 6}>
            <Plus /> Add pack
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">Up to 6 packs.</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Credits per AI image</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(COST_LABELS) as (keyof Pricing["imageCosts"])[]).map((k) => (
            <NumberField key={k} label={COST_LABELS[k]} value={v.imageCosts[k]} max={1000} onChange={(n) => setV((x) => ({ ...x, imageCosts: { ...x.imageCosts, [k]: n } }))} />
          ))}
        </div>
      </div>

      <div className="max-w-xs">
        <NumberField label="Welcome credits for new wallets" value={v.welcomeCredits} max={1000} onChange={(n) => setV((x) => ({ ...x, welcomeCredits: n }))} hint="Given once, when a wallet signs in for the first time." />
      </div>
    </SettingForm>
  )
}

/* Feature switches */

type Features = SettingValue<"features">
const TOOL_LABELS: Record<keyof Features["tools"], string> = { concept: "Idea generator", logo: "Logo generator", memes: "Meme generator", social: "Social bios", content: "Content generator", domains: "Domain ideas" }

export function FeaturesForm({ initial, canWrite }: { initial: Features; canWrite: boolean }) {
  const [v, setV] = useState<Features>(initial)
  const set = (patch: Partial<Features>) => setV((x) => ({ ...x, ...patch }))
  return (
    <SettingForm
      settingKey="features"
      getValue={() => v}
      canWrite={canWrite}
      dirty={!same(v, initial)}
      note="Turning off new sign-ins or a checkout method asks your wallet to sign. When a feature is off, people see a temporarily unavailable message."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle label="AI image generation" hint="Logos, mascots, memes, banners, hero art." checked={v.images} onChange={(b) => set({ images: b })} />
        <Toggle label="New sign-ins" hint="Admins can always sign in." checked={v.signIns} onChange={(b) => set({ signIns: b })} />
        <Toggle label="Publishing websites" hint="Unpublishing always works." checked={v.publishing} onChange={(b) => set({ publishing: b })} />
        <Toggle label="Domain availability search" checked={v.domainSearch} onChange={(b) => set({ domainSearch: b })} />
        <Toggle label="Token waitlist sign-ups" checked={v.waitlist} onChange={(b) => set({ waitlist: b })} />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">Checkout methods</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle label="USDC (Solana wallet)" checked={v.checkoutUsdc} onChange={(b) => set({ checkoutUsdc: b })} />
          <Toggle label="SOL (Solana wallet)" checked={v.checkoutSol} onChange={(b) => set({ checkoutSol: b })} />
          <Toggle label="Other crypto (NOWPayments)" checked={v.checkoutNowpayments} onChange={(b) => set({ checkoutNowpayments: b })} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">AI text tools</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(TOOL_LABELS) as (keyof Features["tools"])[]).map((k) => (
            <Toggle key={k} label={TOOL_LABELS[k]} checked={v.tools[k]} onChange={(b) => setV((x) => ({ ...x, tools: { ...x.tools, [k]: b } }))} />
          ))}
        </div>
      </div>
    </SettingForm>
  )
}

/* Limits */

type Limits = SettingValue<"limits">

export function LimitsForm({ initial, canWrite }: { initial: Limits; canWrite: boolean }) {
  const [v, setV] = useState<Limits>(initial)
  const getValue = () => {
    for (const [k, n] of Object.entries(v)) if (!Number.isInteger(n) || n < 0) return { error: `${k} must be a whole number.` }
    if (v.supportCreditCap < 1) return { error: "The support credit cap must be at least 1." }
    return v
  }
  return (
    <SettingForm settingKey="limits" getValue={getValue} canWrite={canWrite} dirty={!same(v, initial)} note="Raising the support credit cap asks your wallet to sign.">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="AI images per day, whole site" value={v.globalDailyImages} max={1_000_000} onChange={(n) => setV((x) => ({ ...x, globalDailyImages: n }))} hint="0 pauses all images. Counted per server instance." />
        <NumberField label="AI images per day, per wallet" value={v.perWalletDailyImages} max={10_000} onChange={(n) => setV((x) => ({ ...x, perWalletDailyImages: n }))} hint="Resets at 00:00 UTC." />
        <NumberField label="Support credit cap per action" value={v.supportCreditCap} min={1} max={100_000} onChange={(n) => setV((x) => ({ ...x, supportCreditCap: n }))} hint="Larger grants need an admin and a signature." />
      </div>
    </SettingForm>
  )
}

/* Maintenance */

type Maintenance = SettingValue<"maintenance">

export function MaintenanceForm({ initial, canWrite }: { initial: Maintenance; canWrite: boolean }) {
  const [v, setV] = useState<Maintenance>(initial)
  return (
    <SettingForm
      settingKey="maintenance"
      getValue={() => (v.message.trim() ? { ...v, message: v.message.trim() } : { error: "Add a message for visitors." })}
      canWrite={canWrite}
      dirty={!same(v, initial)}
      note="Turning maintenance mode on asks your wallet to sign. The marketing site and this admin panel stay up; admins can still use the app."
    >
      <Toggle label="Maintenance mode" hint="The app shows a maintenance page to everyone except admins, and the AI APIs return 503." checked={v.enabled} onChange={(b) => setV((x) => ({ ...x, enabled: b }))} />
      <label className={labelCls}>
        <span className="font-medium">Message</span>
        <textarea className="min-h-20 rounded-lg border border-border bg-background p-2 text-sm" maxLength={300} value={v.message} onChange={(e) => setV((x) => ({ ...x, message: e.target.value }))} />
        <span className="text-xs text-muted-foreground">{v.message.length}/300</span>
      </label>
    </SettingForm>
  )
}

/* Announcement */

type Announcement = SettingValue<"announcement">

/** ISO (UTC) to a datetime-local value in the admin's timezone, and back. */
function toLocal(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocal(local: string) {
  if (!local) return ""
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString()
}

export function AnnouncementForm({ initial, canWrite }: { initial: Announcement; canWrite: boolean }) {
  const [v, setV] = useState<Announcement>(initial)
  const set = (patch: Partial<Announcement>) => setV((x) => ({ ...x, ...patch }))
  const getValue = () => {
    const link = v.link.trim()
    if (link && !/^https:\/\/\S+$/i.test(link)) return { error: "The link must start with https://" }
    if (v.start && v.end && Date.parse(v.end) <= Date.parse(v.start)) return { error: "The end time must be after the start time." }
    return { ...v, text: v.text.trim(), link }
  }
  return (
    <SettingForm settingKey="announcement" getValue={getValue} canWrite={canWrite} dirty={!same(v, initial)} note="Leave the text empty to remove the banner. The text goes through the safety filter when saved.">
      <label className={labelCls}>
        <span className="font-medium">Text</span>
        <input className={inputCls} maxLength={200} value={v.text} onChange={(e) => set({ text: e.target.value })} placeholder="New: mascot poses are 20% faster." />
        <span className="text-xs text-muted-foreground">{v.text.length}/200</span>
      </label>
      <label className={labelCls}>
        <span className="font-medium">Link (optional, https only)</span>
        <input className={inputCls} type="url" maxLength={300} value={v.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={labelCls}>
          <span className="font-medium">Tone</span>
          <select className={inputCls} value={v.tone} onChange={(e) => set({ tone: e.target.value as Announcement["tone"] })}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
          </select>
        </label>
        <label className={labelCls}>
          <span className="font-medium">Show on</span>
          <select className={inputCls} value={v.target} onChange={(e) => set({ target: e.target.value as Announcement["target"] })}>
            <option value="both">Site and app</option>
            <option value="site">Marketing site</option>
            <option value="app">App</option>
          </select>
        </label>
        <label className={labelCls}>
          <span className="font-medium">Start (your time)</span>
          <input className={inputCls} type="datetime-local" value={toLocal(v.start)} onChange={(e) => set({ start: fromLocal(e.target.value) })} />
        </label>
        <label className={labelCls}>
          <span className="font-medium">End (your time)</span>
          <input className={inputCls} type="datetime-local" value={toLocal(v.end)} onChange={(e) => set({ end: fromLocal(e.target.value) })} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Leave start or end empty to show it right away or until removed. Visitors can dismiss it; a new text shows again.</p>
    </SettingForm>
  )
}

/* Social links */

type Socials = SettingValue<"socials">
const SOCIAL_LABELS: Record<keyof Socials, string> = { x: "X (Twitter)", telegram: "Telegram", discord: "Discord", github: "GitHub", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" }

export function SocialsForm({ initial, canWrite }: { initial: Socials; canWrite: boolean }) {
  const [v, setV] = useState<Socials>(initial)
  const getValue = () => {
    const out = Object.fromEntries(Object.entries(v).map(([k, u]) => [k, u.trim()])) as Socials
    for (const [k, u] of Object.entries(out)) if (u && !/^https:\/\/\S+$/i.test(u)) return { error: `${SOCIAL_LABELS[k as keyof Socials]}: the link must start with https://` }
    return out
  }
  return (
    <SettingForm settingKey="socials" getValue={getValue} canWrite={canWrite} dirty={!same(v, initial)} note="Leave a link empty to hide that account. Shown in the footer, on /token and on the home page.">
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(SOCIAL_LABELS) as (keyof Socials)[]).map((k) => (
          <label key={k} className={labelCls}>
            <span className="font-medium">{SOCIAL_LABELS[k]}</span>
            <input className={inputCls} type="url" maxLength={200} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} placeholder="https://" />
          </label>
        ))}
      </div>
    </SettingForm>
  )
}
