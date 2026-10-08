import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { Order } from "./store"

// NOWPayments hosted invoices: the customer pays in any supported coin on NOWPayments' page; NOWPayments
// then calls our IPN webhook. We grant credits ONLY from a correctly signed IPN with status "finished".

const base = () =>
  process.env.NOWPAYMENTS_API_BASE?.trim() ||
  (process.env.NOWPAYMENTS_SANDBOX === "true" ? "https://api-sandbox.nowpayments.io/v1" : "https://api.nowpayments.io/v1")

export const nowPaymentsEnabled = () => Boolean(process.env.NOWPAYMENTS_API_KEY?.trim() && process.env.NOWPAYMENTS_IPN_SECRET?.trim())

/** Display names for common NOWPayments currency codes. Unknown codes fall back to the uppercased code. */
export const COIN_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  usdttrc20: "USDT (Tron)",
  usdterc20: "USDT (Ethereum)",
  usdtbsc: "USDT (BNB Chain)",
  usdtsol: "USDT (Solana)",
  usdcerc20: "USDC (Ethereum)",
  usdcsol: "USDC (Solana)",
  usdcbsc: "USDC (BNB Chain)",
  ltc: "Litecoin",
  doge: "Dogecoin",
  trx: "TRON",
  bnbbsc: "BNB",
  sol: "Solana",
  xrp: "XRP",
  ton: "Toncoin",
  ada: "Cardano",
  matic: "Polygon",
  xmr: "Monero",
  bch: "Bitcoin Cash",
  dash: "Dash",
}
const POPULAR = ["btc", "eth", "usdttrc20", "usdterc20", "ltc", "doge", "trx", "bnbbsc", "sol", "xrp", "ton"]

let coinCache: { coins: string[]; at: number } | null = null
/**
 * Coins enabled on this NOWPayments account (Settings > Coins), most popular first.
 * Falls back to a popular list if the account call fails.
 */
export async function enabledCoins(): Promise<string[]> {
  if (coinCache && Date.now() - coinCache.at < 10 * 60_000) return coinCache.coins
  let coins = POPULAR
  try {
    const res = await fetch(`${base()}/merchant/coins`, {
      headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!.trim() },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    })
    const json = (await res.json().catch(() => ({}))) as { selectedCurrencies?: string[] }
    if (res.ok && json.selectedCurrencies?.length) {
      const set = json.selectedCurrencies.map((c) => c.toLowerCase())
      coins = [...POPULAR.filter((c) => set.includes(c)), ...set.filter((c) => !POPULAR.includes(c)).sort()]
    }
  } catch {}
  coinCache = { coins, at: Date.now() }
  return coins
}

export async function createInvoice(order: Order, urls: { site: string; app: string }, payCurrency?: string): Promise<{ id: string; url: string }> {
  const res = await fetch(`${base()}/invoice`, {
    method: "POST",
    headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!.trim(), "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      price_amount: order.usd,
      price_currency: "usd",
      order_id: order.id,
      order_description: `FunCoin Lab: ${order.credits} credits`,
      ipn_callback_url: `${urls.site}/api/billing/nowpayments/ipn`,
      success_url: `${urls.app}/dashboard/billing?order=${order.id}`,
      cancel_url: `${urls.app}/dashboard/billing?cancelled=1`,
      ...(payCurrency ? { pay_currency: payCurrency } : {}),
    }),
  })
  const json = (await res.json().catch(() => ({}))) as { id?: string | number; invoice_url?: string; message?: string }
  if (!res.ok || !json.invoice_url || json.id == null) throw new Error(json.message || `NOWPayments error ${res.status}`)
  return { id: String(json.id), url: json.invoice_url }
}

/** Keys sorted at every level, as NOWPayments' current docs do (IPN bodies contain nested objects such as `fee`). */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortDeep((value as Record<string, unknown>)[k])]))
  }
  return value
}

/** HMAC-SHA512 (hex) of the key-sorted JSON body with the IPN secret, sent as the x-nowpayments-sig header. */
export function signIpn(body: Record<string, unknown>, secret: string) {
  return createHmac("sha512", secret).update(JSON.stringify(sortDeep(body))).digest("hex")
}

/** Their older reference code: top-level key list as the JSON.stringify replacer. */
const signIpnLegacy = (body: Record<string, unknown>, secret: string) =>
  createHmac("sha512", secret).update(JSON.stringify(body, Object.keys(body).sort())).digest("hex")

export function verifyIpn(body: Record<string, unknown>, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim()
  if (!secret || !signature || !/^[0-9a-f]+$/i.test(signature.trim())) return false
  const given = Buffer.from(signature.trim().toLowerCase(), "hex")
  return [signIpn(body, secret), signIpnLegacy(body, secret)].some((hex) => {
    const expected = Buffer.from(hex, "hex")
    return expected.length === given.length && timingSafeEqual(expected, given)
  })
}
