import "server-only"
import { unstable_cache, revalidateTag } from "next/cache"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { CREDIT_PACKS, IMAGE_COSTS, WELCOME_CREDITS } from "@/lib/billing/plans"
import { DEFAULT_SUPPORT_CREDIT_CAP } from "@/lib/admin/permissions"

/**
 * Runtime settings stored in site_settings and edited from the admin panel. Every key has a Zod
 * schema and a code default, so the site works exactly as before when the table is empty, a row is
 * invalid, or Supabase is down. Reads are cached (tag "settings") and saved settings revalidate it.
 *
 * The token contract address and the merchant wallet are deliberately NOT here: they stay env-only,
 * so a hijacked admin session can never swap the address people pay or buy.
 */

const packSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,24}$/),
  name: z.string().min(1).max(30),
  credits: z.number().int().min(1).max(100_000),
  usd: z.number().min(0.5).max(10_000),
  tagline: z.string().max(80).default(""),
  best: z.boolean().optional(),
})

const imageCostsSchema = z.object({
  logo: z.number().int().min(0).max(1000),
  mascot: z.number().int().min(0).max(1000),
  meme: z.number().int().min(0).max(1000),
  banner: z.number().int().min(0).max(1000),
  "site-hero": z.number().int().min(0).max(1000),
})

const iso = z.string().datetime().or(z.literal("")).default("")

export const SETTINGS = {
  pricing: {
    schema: z.object({ packs: z.array(packSchema).min(1).max(6), imageCosts: imageCostsSchema, welcomeCredits: z.number().int().min(0).max(1000) }),
    default: { packs: CREDIT_PACKS.map((p) => ({ ...p })), imageCosts: { ...IMAGE_COSTS }, welcomeCredits: WELCOME_CREDITS },
  },
  features: {
    schema: z.object({
      images: z.boolean(),
      signIns: z.boolean(),
      checkoutSol: z.boolean(),
      checkoutUsdc: z.boolean(),
      checkoutNowpayments: z.boolean(),
      publishing: z.boolean(),
      domainSearch: z.boolean(),
      waitlist: z.boolean(),
      tools: z.object({ concept: z.boolean(), logo: z.boolean(), memes: z.boolean(), social: z.boolean(), content: z.boolean(), domains: z.boolean() }),
    }),
    default: {
      images: true,
      signIns: true,
      checkoutSol: true,
      checkoutUsdc: true,
      checkoutNowpayments: true,
      publishing: true,
      domainSearch: true,
      waitlist: true,
      tools: { concept: true, logo: true, memes: true, social: true, content: true, domains: true },
    },
  },
  limits: {
    schema: z.object({
      globalDailyImages: z.number().int().min(0).max(1_000_000),
      perWalletDailyImages: z.number().int().min(0).max(10_000),
      supportCreditCap: z.number().int().min(1).max(100_000),
    }),
    default: {
      globalDailyImages: Number(process.env.IMAGE_GLOBAL_DAILY_LIMIT ?? 300),
      perWalletDailyImages: 60,
      supportCreditCap: DEFAULT_SUPPORT_CREDIT_CAP,
    },
  },
  maintenance: {
    schema: z.object({ enabled: z.boolean(), message: z.string().max(300) }),
    default: { enabled: false, message: "FunCoin Lab is getting an upgrade. We'll be back shortly." },
  },
  announcement: {
    schema: z.object({
      text: z.string().max(200),
      link: z.string().url().startsWith("https://").or(z.literal("")),
      tone: z.enum(["info", "warning"]),
      target: z.enum(["site", "app", "both"]),
      start: iso,
      end: iso,
    }),
    default: { text: "", link: "", tone: "info" as const, target: "both" as const, start: "", end: "" },
  },
  socials: {
    schema: z.object({
      x: z.string(),
      telegram: z.string(),
      discord: z.string(),
      github: z.string(),
      instagram: z.string(),
      tiktok: z.string(),
      youtube: z.string(),
    }),
    default: {
      x: process.env.NEXT_PUBLIC_X_URL ?? "",
      telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
      discord: process.env.NEXT_PUBLIC_DISCORD_URL ?? "",
      github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/devoptirank/funcoin-lab",
      instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
      tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "",
      youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
    },
  },
  safety: {
    schema: z.object({ extraTerms: z.array(z.string().min(2).max(40)).max(500) }),
    default: { extraTerms: [] as string[] },
  },
} as const

export type SettingKey = keyof typeof SETTINGS
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]["schema"]>

export const SETTINGS_TAG = "settings"

/** All stored rows, cached across requests and instances until an admin saves. */
const loadRows = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    const sb = getSupabaseAdmin()
    if (!sb) return {}
    const { data, error } = await sb.from("site_settings").select("key, value")
    if (error || !data) return {}
    return Object.fromEntries(data.map((r: { key: string; value: unknown }) => [r.key, r.value]))
  },
  ["site-settings-v1"],
  { tags: [SETTINGS_TAG], revalidate: 60 },
)

/** A setting, validated, falling back to its code default (also field by field for objects). */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const def = SETTINGS[key].default as SettingValue<K>
  let rows: Record<string, unknown> = {}
  try {
    rows = await loadRows()
  } catch {
    return def
  }
  const stored = rows[key]
  if (stored === undefined) return def
  const merged = stored && typeof stored === "object" && !Array.isArray(stored) ? { ...(def as object), ...(stored as object) } : stored
  const parsed = SETTINGS[key].schema.safeParse(merged)
  return parsed.success ? (parsed.data as SettingValue<K>) : def
}

/** Validate a value an admin submitted. Throws a readable error. */
export function parseSetting<K extends SettingKey>(key: K, value: unknown): SettingValue<K> {
  const parsed = SETTINGS[key].schema.safeParse(value)
  if (!parsed.success) throw Object.assign(new Error(`Invalid ${key}: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`), { status: 400 })
  return parsed.data as SettingValue<K>
}

/** Call after saving, so every instance picks up the change on its next request. */
export function settingsChanged() {
  revalidateTag(SETTINGS_TAG, { expire: 0 })
}
