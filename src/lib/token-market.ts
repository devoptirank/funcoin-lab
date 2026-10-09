/**
 * Live market data for the official token (TOKEN.ca), for the /token dashboard.
 *
 * - Pair, price, market cap, FDV, volume, liquidity and 24h change: DexScreener (tokens/v1), queried
 *   by the exact mint. Only Solana pairs whose BASE token is our mint are accepted.
 * - Mint identity, authorities and supply: the mint account itself, from our Solana RPC.
 * - Holders: Helius DAS getTokenAccounts, only when SOLANA_RPC_URL is a Helius endpoint.
 * - Price history: GeckoTerminal OHLCV for the verified DexScreener pair (DexScreener has no history API).
 *
 * Nothing is estimated: a value the provider doesn't return is null and the UI says so. Results are
 * cached briefly on the server so visitors never hit the providers' rate limits.
 */
import "server-only"
import { unstable_cache } from "next/cache"
import { TOKEN } from "@/lib/official"

const TIMEOUT_MS = 8000
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "application/json", ...init?.headers } })
  if (res.status === 429) throw new Error("rate_limited")
  if (!res.ok) throw new Error(`http_${res.status}`)
  return res.json()
}

const DEX_NAMES: Record<string, string> = {
  pumpfun: "pump.fun (bonding curve)",
  pumpswap: "PumpSwap",
  raydium: "Raydium",
  meteora: "Meteora",
  orca: "Orca",
  jupiter: "Jupiter",
}

export type TokenPair = {
  address: string
  dexId: string
  dexName: string
  url: string
  quoteSymbol: string
  createdAt: string | null
}

export type TokenMarket = {
  mint: string
  name: string | null
  symbol: string | null
  pair: TokenPair | null
  priceUsd: number | null
  marketCap: number | null
  fdv: number | null
  change24h: number | null
  volume24h: number | null
  liquidityUsd: number | null
  onchain: { name: string | null; symbol: string | null; supply: number; mintAuthorityRevoked: boolean; freezeAuthorityRevoked: boolean } | null
  holders: { count: number; capped: boolean } | null
  fetchedAt: string
  /** True when the providers failed and this is the last good result from this server. */
  stale: boolean
}

type DexPair = {
  chainId?: string
  dexId?: string
  url?: string
  pairAddress?: string
  baseToken?: { address?: string; name?: string; symbol?: string }
  quoteToken?: { symbol?: string }
  priceUsd?: string
  priceChange?: { h24?: number }
  volume?: { h24?: number }
  liquidity?: { usd?: number }
  fdv?: number
  marketCap?: number
  pairCreatedAt?: number
}

/** The most liquid Solana pair whose base token is exactly our mint (then by 24h volume). */
function pickPair(pairs: DexPair[], mint: string): DexPair | null {
  const ours = pairs.filter(
    (p) => p.chainId === "solana" && p.baseToken?.address === mint && typeof p.pairAddress === "string" && /^https:\/\/dexscreener\.com\//.test(p.url ?? ""),
  )
  ours.sort((a, b) => (num(b.liquidity?.usd) ?? 0) - (num(a.liquidity?.usd) ?? 0) || (num(b.volume?.h24) ?? 0) - (num(a.volume?.h24) ?? 0))
  return ours[0] ?? null
}

const rpcUrl = () => process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com"

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const body = (await getJson(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })) as { result?: T; error?: unknown }
  if (body.error || body.result === undefined) throw new Error("rpc_error")
  return body.result
}

type ParsedMint = {
  value: {
    data: {
      parsed: {
        type: string
        info: {
          decimals: number
          supply: string
          mintAuthority: string | null
          freezeAuthority: string | null
          extensions?: { extension: string; state: { name?: string; symbol?: string } }[]
        }
      }
    }
  } | null
}

async function loadOnchain(mint: string): Promise<TokenMarket["onchain"]> {
  try {
    const res = await rpc<ParsedMint>("getAccountInfo", [mint, { encoding: "jsonParsed" }])
    const parsed = res.value?.data?.parsed
    if (!parsed || parsed.type !== "mint") return null
    const meta = parsed.info.extensions?.find((e) => e.extension === "tokenMetadata")?.state
    return {
      name: meta?.name ?? null,
      symbol: meta?.symbol ?? null,
      supply: Number(BigInt(parsed.info.supply)) / 10 ** parsed.info.decimals,
      mintAuthorityRevoked: parsed.info.mintAuthority === null,
      freezeAuthorityRevoked: parsed.info.freezeAuthority === null,
    }
  } catch {
    return null
  }
}

const HOLDER_PAGES = 5
const PAGE_SIZE = 1000

/**
 * Wallets holding a non-zero balance, from Helius DAS. The pool / bonding-curve account is not a
 * holder, so it's excluded. Stops after 5,000 token accounts and reports the count as "at least".
 */
async function loadHolders(mint: string, pairAddress: string | null): Promise<TokenMarket["holders"]> {
  if (!/helius/i.test(rpcUrl())) return null
  try {
    const owners = new Set<string>()
    let capped = false
    for (let page = 1; page <= HOLDER_PAGES; page++) {
      const res = await rpc<{ token_accounts: { owner: string; amount: number }[] }>("getTokenAccounts", { mint, limit: PAGE_SIZE, page })
      for (const a of res.token_accounts) if (a.amount > 0 && a.owner !== pairAddress) owners.add(a.owner)
      if (res.token_accounts.length < PAGE_SIZE) break
      if (page === HOLDER_PAGES) capped = true
    }
    return { count: owners.size, capped }
  } catch {
    return null
  }
}

async function loadMarket(mint: string): Promise<Omit<TokenMarket, "stale">> {
  // Throws when DexScreener fails, so a failure is never cached.
  const pairs = (await getJson(`https://api.dexscreener.com/tokens/v1/solana/${mint}`)) as DexPair[]
  if (!Array.isArray(pairs)) throw new Error("bad_response")
  const p = pickPair(pairs, mint)
  const [onchain, holders] = await Promise.all([loadOnchain(mint), loadHolders(mint, p?.pairAddress ?? null)])
  return {
    mint,
    name: p?.baseToken?.name ?? null,
    symbol: p?.baseToken?.symbol ?? null,
    pair: p
      ? {
          address: p.pairAddress!,
          dexId: p.dexId ?? "",
          dexName: DEX_NAMES[p.dexId ?? ""] ?? p.dexId ?? "Unknown DEX",
          url: p.url!,
          quoteSymbol: p.quoteToken?.symbol ?? "",
          createdAt: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : null,
        }
      : null,
    priceUsd: num(p?.priceUsd),
    marketCap: num(p?.marketCap),
    fdv: num(p?.fdv),
    change24h: num(p?.priceChange?.h24),
    volume24h: num(p?.volume?.h24),
    liquidityUsd: num(p?.liquidity?.usd),
    onchain,
    holders,
    fetchedAt: new Date().toISOString(),
  }
}

const cachedMarket = unstable_cache(loadMarket, ["token-market-v1"], { revalidate: 30 })
let lastGood: Omit<TokenMarket, "stale"> | null = null

/** Market data for the official token, or null when the token isn't live or nothing could be loaded. */
export async function getTokenMarket(): Promise<TokenMarket | null> {
  if (!TOKEN.live) return null
  try {
    lastGood = await cachedMarket(TOKEN.ca)
    return { ...lastGood, stale: false }
  } catch {
    return lastGood ? { ...lastGood, stale: true } : null
  }
}

export const CHART_RANGES = {
  "1h": { label: "1H", timeframe: "minute", aggregate: 1, limit: 60, ms: 3_600_000, revalidate: 60 },
  "24h": { label: "24H", timeframe: "minute", aggregate: 15, limit: 96, ms: 86_400_000, revalidate: 120 },
  "7d": { label: "7D", timeframe: "hour", aggregate: 1, limit: 168, ms: 7 * 86_400_000, revalidate: 300 },
  "30d": { label: "30D", timeframe: "hour", aggregate: 4, limit: 180, ms: 30 * 86_400_000, revalidate: 600 },
} as const
export type ChartRange = keyof typeof CHART_RANGES
export const isChartRange = (v: unknown): v is ChartRange => typeof v === "string" && v in CHART_RANGES

/** [unix ms, close price in USD] for each candle that had trades, oldest first. */
export type ChartPoint = [number, number]

async function loadChart(range: ChartRange, pairAddress: string, mint: string): Promise<{ points: ChartPoint[]; fetchedAt: string }> {
  const r = CHART_RANGES[range]
  const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pairAddress}/ohlcv/${r.timeframe}?aggregate=${r.aggregate}&limit=${r.limit}&currency=usd&token=base`
  const body = (await getJson(url)) as { data?: { attributes?: { ohlcv_list?: unknown[] } }; meta?: { base?: { address?: string } } }
  // The candles must be for our mint, priced in USD.
  if (body.meta?.base?.address !== mint) throw new Error("token_mismatch")
  const since = Date.now() - r.ms
  const points = (body.data?.attributes?.ohlcv_list ?? [])
    .map((c) => (Array.isArray(c) ? ([num(c[0]), num(c[4])] as const) : [null, null] as const))
    .filter((c): c is readonly [number, number] => c[0] !== null && c[1] !== null && c[1] > 0)
    .map(([t, close]) => [t * 1000, close] as ChartPoint)
    .filter(([t]) => t >= since)
    .sort((a, b) => a[0] - b[0])
  return { points, fetchedAt: new Date().toISOString() }
}

const chartCaches = Object.fromEntries(
  (Object.keys(CHART_RANGES) as ChartRange[]).map((k) => [k, unstable_cache(loadChart, [`token-chart-v1-${k}`], { revalidate: CHART_RANGES[k].revalidate })]),
) as Record<ChartRange, typeof loadChart>

/** Real price history for the verified pair. Throws when the history provider fails. */
export async function getTokenChart(range: ChartRange) {
  const market = await getTokenMarket()
  if (!market?.pair) return null
  return { ...(await chartCaches[range](range, market.pair.address, market.mint)), source: "GeckoTerminal", pair: market.pair.address }
}
