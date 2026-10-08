/**
 * Official FunCoin Lab links and token details, all from NEXT_PUBLIC_* env vars so they can change
 * without a code edit. Anything left empty is simply not shown.
 *
 * The contract address is the one value scammers fake most, so it is validated and shown in exactly
 * one form everywhere (footer, /token, home).
 */

const env = (v: string | undefined) => (v ?? "").trim()
const httpsUrl = (v: string | undefined) => {
  const u = env(v)
  return /^https:\/\/\S+$/i.test(u) ? u : ""
}

export type SocialId = "x" | "telegram" | "discord" | "github" | "instagram" | "tiktok" | "youtube"

export const SOCIALS: { id: SocialId; label: string; url: string }[] = (
  [
    { id: "x", label: "X (Twitter)", url: httpsUrl(process.env.NEXT_PUBLIC_X_URL) },
    { id: "telegram", label: "Telegram", url: httpsUrl(process.env.NEXT_PUBLIC_TELEGRAM_URL) },
    { id: "discord", label: "Discord", url: httpsUrl(process.env.NEXT_PUBLIC_DISCORD_URL) },
    { id: "github", label: "GitHub", url: httpsUrl(process.env.NEXT_PUBLIC_GITHUB_URL) || "https://github.com/devoptirank/funcoin-lab" },
    { id: "instagram", label: "Instagram", url: httpsUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL) },
    { id: "tiktok", label: "TikTok", url: httpsUrl(process.env.NEXT_PUBLIC_TIKTOK_URL) },
    { id: "youtube", label: "YouTube", url: httpsUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL) },
  ] as const
).filter((s) => s.url)

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
