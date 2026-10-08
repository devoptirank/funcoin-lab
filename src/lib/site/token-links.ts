import type { SiteConfig } from "@/lib/types"

/**
 * Links for a generated meme site's token and community. Shared by the editor, the live renderer and
 * the HTML export so all three agree. Market links are built from the contract address (Solana mint)
 * and only ever point at the well-known sites below.
 */

export const SOCIAL_KEYS = ["x", "telegram", "discord", "tiktok", "instagram", "youtube", "website"] as const
export type SocialKey = (typeof SOCIAL_KEYS)[number]
export const SOCIAL_LABELS: Record<SocialKey, string> = {
  x: "X / Twitter",
  telegram: "Telegram",
  discord: "Discord",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  website: "Website",
}

export const isHttps = (u: string | undefined): u is string => Boolean(u && /^https:\/\/\S+$/i.test(u))
export const isSolanaAddress = (s: string | undefined): s is string => Boolean(s && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s))

export type TokenLink = { id: string; label: string; url: string }

/** Buy button target and market links for a token, or nothing until the contract address is set. */
export function tokenLinks(token: SiteConfig["token"], ticker: string): { live: boolean; buy: TokenLink | null; markets: TokenLink[] } {
  const ca = token.contract?.trim() ?? ""
  if (!ca) return { live: false, buy: null, markets: [] }
  const sol = isSolanaAddress(ca)
  const markets: TokenLink[] = []
  if (sol && token.pumpfun !== false) markets.push({ id: "pumpfun", label: "pump.fun", url: `https://pump.fun/coin/${ca}` })
  if (isHttps(token.dexUrl)) markets.push({ id: "dex", label: "DexScreener", url: token.dexUrl })
  else if (sol) markets.push({ id: "dex", label: "DexScreener", url: `https://dexscreener.com/solana/${ca}` })
  if (sol) {
    markets.push({ id: "birdeye", label: "Birdeye", url: `https://birdeye.so/token/${ca}?chain=solana` })
    markets.push({ id: "solscan", label: "Solscan", url: `https://solscan.io/token/${ca}` })
  }
  const buyUrl = isHttps(token.buyUrl) ? token.buyUrl : sol ? `https://jup.ag/swap/SOL-${ca}` : ""
  return { live: true, buy: buyUrl ? { id: "buy", label: `Buy $${ticker}`, url: buyUrl } : null, markets }
}

/** Social links that are filled in, in display order. */
export function socialLinks(links: SiteConfig["community"]["links"]): { key: SocialKey; label: string; url: string }[] {
  return SOCIAL_KEYS.flatMap((key) => {
    const url = (links as Partial<Record<SocialKey, string>>)[key]
    return isHttps(url) ? [{ key, label: SOCIAL_LABELS[key], url }] : []
  })
}

export const HOW_TO_BUY = [
  { title: "Get a wallet", text: "Install Phantom or Solflare on your phone or as a browser extension." },
  { title: "Add SOL", text: "Buy SOL on an exchange or in your wallet app, then send it to your wallet." },
  { title: "Swap", text: "Open the Buy link, connect your wallet and swap SOL for the token." },
  { title: "Check the address", text: "Only trust the contract address shown on this site. Never share your seed phrase." },
]
