/**
 * Official FunCoin Lab links and token details, all from NEXT_PUBLIC_* env vars so they can change
 * without a code edit. Anything left empty is simply not shown.
 *
 * The contract address is the one value scammers fake most, so it is validated and shown in exactly
 * one form everywhere (footer, /token, home). It stays env-only on purpose: admin Settings can change
 * the social links but never the contract address.
 */
import "server-only"
import { getSetting } from "@/lib/settings"

const env = (v: string | undefined) => (v ?? "").trim()
const httpsUrl = (v: string | undefined) => {
  const u = env(v)
  return /^https:\/\/\S+$/i.test(u) ? u : ""
}

export type SocialId = "x" | "telegram" | "discord" | "github" | "instagram" | "tiktok" | "youtube"
export type Social = { id: SocialId; label: string; url: string }

/** Display order and names for the official accounts. */
export const SOCIAL_LABELS: { id: SocialId; label: string }[] = [
  { id: "x", label: "X (Twitter)" },
  { id: "telegram", label: "Telegram" },
  { id: "discord", label: "Discord" },
  { id: "github", label: "GitHub" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
]

const ENV_SOCIALS: Record<SocialId, string> = {
  x: httpsUrl(process.env.NEXT_PUBLIC_X_URL),
  telegram: httpsUrl(process.env.NEXT_PUBLIC_TELEGRAM_URL),
  discord: httpsUrl(process.env.NEXT_PUBLIC_DISCORD_URL),
  github: httpsUrl(process.env.NEXT_PUBLIC_GITHUB_URL) || "https://github.com/devoptirank/funcoin-lab",
  instagram: httpsUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  tiktok: httpsUrl(process.env.NEXT_PUBLIC_TIKTOK_URL),
  youtube: httpsUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),
}

/** The env defaults only. Prefer getSocials(), which applies the admin's Settings on top. */
export const SOCIALS: Social[] = SOCIAL_LABELS.map((s) => ({ ...s, url: ENV_SOCIALS[s.id] })).filter((s) => s.url)

/**
 * The official social accounts: links saved in admin Settings over the NEXT_PUBLIC_* env defaults.
 * Only https links are returned; an empty link hides that account. Falls back to the env values if
 * settings can't be read.
 */
export async function getSocials(): Promise<Social[]> {
  let stored: Record<SocialId, string> = ENV_SOCIALS
  try {
    stored = await getSetting("socials")
  } catch {
    stored = ENV_SOCIALS
  }
  return SOCIAL_LABELS.map((s) => ({ ...s, url: httpsUrl(stored[s.id]) })).filter((s) => s.url)
}

/** Solana addresses are base58, 32 to 44 characters. Anything else is ignored rather than shown. */
const CA = env(process.env.NEXT_PUBLIC_TOKEN_CA)
const validCa = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(CA) ? CA : ""

export const TOKEN = {
  name: env(process.env.NEXT_PUBLIC_TOKEN_NAME) || "FunCoin Lab",
  ticker: env(process.env.NEXT_PUBLIC_TOKEN_TICKER).replace(/^\$/, "").toUpperCase() || "FUNLAB",
  /** Contract address (mint). Empty until launch. */
  ca: validCa,
  live: Boolean(validCa),
  links: (
    [
      { id: "pumpfun", label: "pump.fun", url: httpsUrl(process.env.NEXT_PUBLIC_PUMPFUN_URL) || (validCa ? `https://pump.fun/coin/${validCa}` : "") },
      { id: "dex", label: "DexScreener", url: httpsUrl(process.env.NEXT_PUBLIC_DEX_URL) || (validCa ? `https://dexscreener.com/solana/${validCa}` : "") },
      { id: "solscan", label: "Solscan", url: validCa ? `https://solscan.io/token/${validCa}` : "" },
      { id: "jupiter", label: "Jupiter", url: httpsUrl(process.env.NEXT_PUBLIC_JUPITER_URL) },
      { id: "coingecko", label: "CoinGecko", url: httpsUrl(process.env.NEXT_PUBLIC_COINGECKO_URL) },
      { id: "cmc", label: "CoinMarketCap", url: httpsUrl(process.env.NEXT_PUBLIC_CMC_URL) },
    ] as const
  ).filter((l) => l.url),
}
