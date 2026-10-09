"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowUpRight, BadgeCheck, Check, Copy, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { copyText } from "@/lib/client-api"
import { cn } from "@/lib/utils"
import type { ChartPoint, ChartRange, TokenMarket } from "@/lib/token-market"
import { usdCompact, usdPrice } from "@/lib/token-format"

const RANGES: { id: ChartRange; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
]
const MARKET_POLL_MS = 60_000
const CHART_POLL_MS = 120_000

const time = (iso: string | number) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

type Polled<T> = { data: T | null; error: string | null; loading: boolean }

/** One request; never throws. Errors come back as { error } and keep the previous data on screen. */
async function fetchPolled<T>(url: string): Promise<{ data: T } | { error: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const body = await res.json().catch(() => null)
    return !res.ok || !body || body.error ? { error: body?.error ?? `http_${res.status}` } : { data: body as T }
  } catch {
    return { error: "network" }
  }
}

/** Fetch JSON, refreshing on an interval only while the tab is visible. */
function usePolled<T>(url: string, intervalMs: number) {
  const [state, setState] = useState<Polled<T>>({ data: null, error: null, loading: true })
  const seq = useRef(0)

  const load = useCallback(() => {
    const id = ++seq.current
    return fetchPolled<T>(url).then((r) => {
      if (id !== seq.current) return
      setState((s) => ("data" in r ? { data: r.data, error: null, loading: false } : { data: s.data, error: r.error, loading: false }))
    })
  }, [url])

  useEffect(() => {
    // Load now, then keep polling. A new chart range remounts the chart (key), so state starts fresh.
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [load, intervalMs])

  // A manual refresh shows the spinner; background polls update quietly.
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    return load()
  }, [load])

  return { ...state, reload }
}

type ChartResponse = { range: ChartRange; points: ChartPoint[]; fetchedAt: string; source: string; pair: string }

export function TokenDashboard({ ca, ticker, pumpUrl }: { ca: string; ticker: string; pumpUrl: string }) {
  const market = usePolled<TokenMarket>("/api/token/market", MARKET_POLL_MS)
  const m = market.data
  const [range, setRange] = useState<ChartRange>("24h")
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(ca)) {
      setCopied(true)
      toast.success("Contract address copied", { description: ca })
      window.setTimeout(() => setCopied(false), 1800)
    } else {
      toast.error("Couldn't copy. Select the address and copy it by hand.")
    }
  }

  const onBondingCurve = m?.pair?.dexId === "pumpfun"
  const metrics: { label: string; value: string | null; note?: string; tone?: "up" | "down" }[] = m
    ? [
        { label: "Price", value: m.priceUsd !== null ? usdPrice(m.priceUsd) : null },
        {
          label: "24h change",
          value: m.change24h !== null ? `${m.change24h > 0 ? "+" : ""}${m.change24h.toFixed(2)}%` : null,
          tone: m.change24h === null || m.change24h === 0 ? undefined : m.change24h > 0 ? "up" : "down",
        },
        { label: "Market cap", value: m.marketCap !== null ? usdCompact(m.marketCap) : null, note: "Price × circulating supply" },
        { label: "FDV", value: m.fdv !== null ? usdCompact(m.fdv) : null, note: "Price × total supply" },
        { label: "24h volume", value: m.volume24h !== null ? usdCompact(m.volume24h) : null },
        {
          label: "Liquidity",
          value: m.liquidityUsd !== null ? usdCompact(m.liquidityUsd) : null,
          note: m.liquidityUsd === null && onBondingCurve ? "Not reported while trading on the pump.fun bonding curve" : undefined,
        },
        {
          label: "Total supply",
          value: m.onchain ? m.onchain.supply.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 3 }) : null,
          note: m.onchain ? `${m.onchain.supply.toLocaleString("en-US")} tokens, read from the mint account on Solana` : undefined,
        },
        {
          label: "Holders",
          value: m.holders ? `${m.holders.count.toLocaleString("en-US")}${m.holders.capped ? "+" : ""}` : null,
          note: m.holders ? "Wallets with a balance, excluding the pool" : undefined,
        },
      ]
    : []

  return (
    <section aria-labelledby="market-title" className="mt-10 rounded-[2rem] border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="market-title" className="font-heading text-2xl font-extrabold">
            ${ticker} live market
          </h2>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {m ? (
              <>
                Updated {time(m.fetchedAt)}
                {m.stale ? " (delayed: showing the last data we could load)" : ". Refreshes every minute; data can lag a few seconds."}
              </>
            ) : market.loading ? (
              "Loading live data..."
            ) : (
              "Live data is unavailable right now."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void market.reload()}
          disabled={market.loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:border-lab-fill/60 disabled:opacity-60"
        >
          {market.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh
        </button>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a href={pumpUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-lab-fill px-4 py-2 text-sm font-semibold text-lab-ink">
          Buy on Pump.fun <ArrowUpRight className="size-4 opacity-70" aria-hidden />
        </a>
        {m?.pair && (
          <a href={m.pair.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
            View on DexScreener <ArrowUpRight className="size-4 opacity-60" aria-hidden />
          </a>
        )}
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
          {copied ? <Check className="size-4 text-lab" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy contract address"}
        </button>
        <a href={`https://solscan.io/token/${ca}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
          Solscan <ArrowUpRight className="size-4 opacity-60" aria-hidden />
        </a>
        <a href={`https://explorer.solana.com/address/${ca}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
          Solana Explorer <ArrowUpRight className="size-4 opacity-60" aria-hidden />
        </a>
      </div>

      {/* Error with no data at all */}
      {!m && !market.loading && (
        <div role="alert" className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" aria-hidden /> We couldn&apos;t reach the market data provider.
          </p>
          <p className="text-muted-foreground">No numbers are shown rather than guessed. The links above still work, or try again in a moment.</p>
          <button type="button" onClick={() => void market.reload()} className="rounded-full border border-border px-3 py-1.5 font-semibold hover:border-lab-fill/60">
            Try again
          </button>
        </div>
      )}

      {/* Metrics */}
      {(m || market.loading) && (
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {m
            ? metrics.map((x) => (
                <div key={x.label} className="min-w-0 rounded-2xl border border-border bg-background/60 p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">{x.label}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-heading text-lg font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-2xl",
                      x.tone === "up" && "text-emerald-500",
                      x.tone === "down" && "text-red-500",
                      x.value === null && "text-base font-semibold text-muted-foreground sm:text-base",
                    )}
                  >
                    {x.value ?? "Not reported"}
                  </dd>
                  {x.note && <p className="mt-1 text-xs text-muted-foreground">{x.note}</p>}
                </div>
              ))
            : Array.from({ length: 8 }, (_, i) => <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-foreground/[0.05]" aria-hidden />)}
        </dl>
      )}

      {/* Verified pair and mint */}
      {m && (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">Trading pair</p>
            {m.pair ? (
              <>
                <p className="mt-1 font-semibold">
                  {m.symbol ?? ticker} / {m.pair.quoteSymbol} on {m.pair.dexName}
                </p>
                <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{m.pair.address}</p>
                {m.pair.createdAt && <p className="mt-1 text-xs text-muted-foreground">Created {time(m.pair.createdAt)}</p>}
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">No trading pair found for this mint yet.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">Mint check (on-chain)</p>
            {m.onchain ? (
              <ul className="mt-1 space-y-1">
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-lab" aria-hidden /> {m.onchain.name ?? "Unnamed"} ({m.onchain.symbol ?? "no symbol"})
                </li>
                <li className="text-muted-foreground">Mint authority: {m.onchain.mintAuthorityRevoked ? "revoked (no new tokens can be minted)" : "active"}</li>
                <li className="text-muted-foreground">Freeze authority: {m.onchain.freezeAuthorityRevoked ? "revoked" : "active"}</li>
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">Couldn&apos;t read the mint account right now.</p>
            )}
          </div>
        </div>
      )}

      <PriceChart key={range} range={range} onRange={setRange} lastPrice={m?.priceUsd ?? null} />

      <p className="mt-6 text-xs text-muted-foreground">
        Sources: price, market cap, FDV, volume, liquidity and pair from DexScreener; price history from GeckoTerminal; supply and mint details from the Solana
        blockchain; holders from Helius. &quot;Not reported&quot; means the provider returned no value, so we show nothing rather than an estimate. Not financial advice.
      </p>
    </section>
  )
}

const RANGE_MS: Record<ChartRange, number> = { "1h": 3_600_000, "24h": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000 }
const axisTime = (t: number, range: ChartRange) =>
  new Date(t).toLocaleString(undefined, range === "1h" || range === "24h" ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" })

/**
 * Price over the selected window, from real trades only. Each period with trades is a dot joined by a
 * solid line. Between the last trade and now the price hasn't changed, so a dashed line carries the
 * last traded price forward (clearly labelled), which keeps a thinly traded token's chart readable.
 */
function PriceChart({ range, onRange, lastPrice }: { range: ChartRange; onRange: (r: ChartRange) => void; lastPrice: number | null }) {
  const chart = usePolled<ChartResponse>(`/api/token/chart?range=${range}`, CHART_POLL_MS)
  const points = chart.data?.range === range ? chart.data.points : null
  const [hover, setHover] = useState<number | null>(null)

  const W = 600
  const H = 200
  const end = chart.data ? new Date(chart.data.fetchedAt).getTime() : 0
  const startT = end - RANGE_MS[range]
  // The price carried forward: the last trade in range, else the current market price.
  const carry = points?.length ? points[points.length - 1][1] : lastPrice
  const drawable = points !== null && carry !== null

  let solid = ""
  let dashed = ""
  let area = ""
  let dots: { x: number; y: number }[] = []
  let lo = 0
  let hi = 0
  if (drawable) {
    const prices = [...points.map((p) => p[1]), carry]
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const pad = (max - min) * 0.15 || max * 0.08
    lo = min - pad
    hi = max + pad
    const x = (t: number) => Math.min(W, Math.max(0, ((t - startT) / (end - startT)) * W))
    const y = (v: number) => H - ((v - lo) / (hi - lo)) * H
    dots = points.map(([t, v]) => ({ x: x(t), y: y(v) }))
    solid = dots.map((d, i) => `${i ? "L" : "M"}${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(" ")
    const from = dots.at(-1) ?? { x: 0, y: y(carry) }
    dashed = `M${from.x.toFixed(1)},${from.y.toFixed(1)} L${W},${from.y.toFixed(1)}`
    const first = dots[0] ?? from
    area = `M${first.x.toFixed(1)},${H} ${dots.map((d) => `L${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(" ")} L${from.x.toFixed(1)},${from.y.toFixed(1)} L${W},${from.y.toFixed(1)} L${W},${H} Z`
  }
  const hovered = hover !== null && points?.[hover] ? points[hover] : null

  return (
    <figure className="mt-6 rounded-2xl border border-border p-4">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="block text-xs font-semibold text-muted-foreground">{hovered ? "Traded at" : "Price (USD)"}</span>
          <span className="block font-heading text-lg font-extrabold tabular-nums">
            {hovered ? usdPrice(hovered[1]) : lastPrice !== null ? usdPrice(lastPrice) : carry !== null ? usdPrice(carry) : " "}
            <span className="ml-2 text-xs font-normal text-muted-foreground">{hovered ? time(hovered[0]) : lastPrice !== null ? "now" : ""}</span>
          </span>
        </span>
        <span role="group" aria-label="Chart range" className="inline-flex rounded-full border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => onRange(r.id)}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold", range === r.id ? "bg-lab-fill text-lab-ink" : "text-muted-foreground hover:text-foreground")}
            >
              {r.label}
            </button>
          ))}
        </span>
      </figcaption>

      <div className="relative mt-3 h-48 sm:h-56">
        {!points && chart.loading && <div className="size-full animate-pulse rounded-xl bg-foreground/[0.05]" aria-hidden />}
        {!points && !chart.loading && (
          <div role="alert" className="grid size-full place-items-center rounded-xl bg-foreground/[0.03] p-4 text-center text-sm text-muted-foreground">
            <span>
              Price history is unavailable right now.{" "}
              <button type="button" className="font-semibold underline underline-offset-4" onClick={() => void chart.reload()}>
                Try again
              </button>
            </span>
          </div>
        )}
        {points && !drawable && (
          <div className="grid size-full place-items-center rounded-xl bg-foreground/[0.03] p-4 text-center text-sm text-muted-foreground">
            No trades in this time range, so there is no price history to draw.
          </div>
        )}
        {drawable && (
          <div
            className="relative size-full"
            role="img"
            aria-label={`Price over the last ${range}: ${points.length} trading ${points.length === 1 ? "period" : "periods"}, last traded at ${usdPrice(carry)}.`}
            onPointerMove={(e) => {
              if (!dots.length) return
              const box = e.currentTarget.getBoundingClientRect()
              const px = ((e.clientX - box.left) / box.width) * W
              let best = 0
              dots.forEach((d, i) => {
                if (Math.abs(d.x - px) < Math.abs(dots[best].x - px)) best = i
              })
              setHover(Math.abs(dots[best].x - px) < 40 ? best : null)
            }}
            onPointerLeave={() => setHover(null)}
          >
            {/* Grid lines and price labels */}
            {[0, 1 / 3, 2 / 3, 1].map((f) => (
              <div key={f} className="absolute inset-x-0 border-t border-border/50" style={{ top: `${f * 100}%` }} aria-hidden>
                <span className="absolute -top-2 left-0 bg-card pr-1 text-[10px] text-muted-foreground tabular-nums">{usdPrice(hi - (hi - lo) * f)}</span>
              </div>
            ))}
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="token-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--lab)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--lab)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#token-area)" />
              {dots.length > 1 && <path d={solid} fill="none" stroke="var(--lab)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
              <path d={dashed} fill="none" stroke="var(--lab)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* Trade dots in HTML so they stay round when the SVG stretches */}
            {dots.map((d, i) => (
              <span
                key={i}
                className={cn("absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lab)] ring-4 ring-[color-mix(in_oklab,var(--lab)_25%,transparent)]", hover === i && "size-3.5")}
                style={{ left: `${(d.x / W) * 100}%`, top: `${(d.y / H) * 100}%` }}
                aria-hidden
              />
            ))}
            {/* "Now" marker at the end of the dashed line */}
            <span
              className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--lab)] bg-card"
              style={{ top: `${((dots.at(-1)?.y ?? H - ((carry - lo) / (hi - lo)) * H) / H) * 100}%` }}
              aria-hidden
            />
          </div>
        )}
      </div>
      {drawable && (
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums" aria-hidden>
          <span>{axisTime(startT, range)}</span>
          <span>{axisTime(startT + (end - startT) / 2, range)}</span>
          <span>Now</span>
        </div>
      )}

      {drawable && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--lab)]" aria-hidden /> Trade ({points.length} {points.length === 1 ? "period" : "periods"} with trades)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-[var(--lab)]" aria-hidden /> Last traded price, no trades since
          </span>
          {points.length === 0 && <span>No trades in this range; showing the current price.</span>}
          <span className="basis-full">Chart: trades from GeckoTerminal. Headline price: DexScreener, so the two can differ slightly.</span>
        </p>
      )}
    </figure>
  )
}
