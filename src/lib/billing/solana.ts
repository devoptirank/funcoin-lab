import "server-only"
import { Connection, PublicKey, clusterApiUrl, type Cluster, type ParsedTransactionWithMeta } from "@solana/web3.js"
import type { Order } from "./store"

// Direct wallet payments (Solana Pay style): each order gets a fresh "reference" public key that the
// payer's transaction must include. We find the transaction by that reference and check that it
// paid our address at least the quoted amount, in the right token.

export const USDC_MINT: Record<string, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
}

export function solanaConfig() {
  const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || process.env.SOLANA_CLUSTER || "mainnet-beta") as Cluster
  const rpc = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(cluster)
  const merchant = process.env.MERCHANT_SOLANA_ADDRESS?.trim() || ""
  let merchantOk = false
  try {
    merchantOk = Boolean(merchant) && PublicKey.isOnCurve(new PublicKey(merchant).toBytes())
  } catch {}
  return { cluster, rpc, merchant: merchantOk ? merchant : "", usdcMint: USDC_MINT[cluster] ?? USDC_MINT["mainnet-beta"] }
}

export function walletPaymentsEnabled() {
  return Boolean(solanaConfig().merchant)
}

let conn: Connection | null = null
export function connection() {
  conn ??= new Connection(solanaConfig().rpc, "confirmed")
  return conn
}

let priceCache: { usd: number; at: number } | null = null
/** SOL/USD spot price (cached 60s). */
export async function solUsdPrice(): Promise<number> {
  if (priceCache && Date.now() - priceCache.at < 60_000) return priceCache.usd
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Price feed error ${res.status}`)
  const json = (await res.json()) as { solana?: { usd?: number } }
  const usd = json.solana?.usd
  if (!usd || usd <= 0) throw new Error("No SOL price available")
  priceCache = { usd, at: Date.now() }
  return usd
}

type Verdict = { ok: true; signature: string } | { ok: false; reason: string; pending?: boolean }

async function findSignature(reference: string): Promise<string | null> {
  const sigs = await connection().getSignaturesForAddress(new PublicKey(reference), { limit: 5 }, "confirmed")
  return sigs.find((s) => !s.err)?.signature ?? null
}

function paidAmount(tx: ParsedTransactionWithMeta, order: Order, merchant: string, usdcMint: string): bigint {
  const meta = tx.meta
  if (!meta) return BigInt(0)
  if (order.method === "sol") {
    const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58())
    const i = keys.indexOf(merchant)
    if (i < 0) return BigInt(0)
    return BigInt(meta.postBalances[i] - meta.preBalances[i])
  }
  // USDC: change in the merchant's token balance for the USDC mint.
  const post = meta.postTokenBalances?.find((b) => b.owner === merchant && b.mint === usdcMint)
  const pre = meta.preTokenBalances?.find((b) => b.owner === merchant && b.mint === usdcMint && b.accountIndex === post?.accountIndex)
  if (!post) return BigInt(0)
  return BigInt(post.uiTokenAmount.amount) - BigInt(pre?.uiTokenAmount.amount ?? "0")
}

export async function verifyWalletPayment(order: Order, signatureHint?: string): Promise<Verdict> {
  const { merchant, usdcMint } = solanaConfig()
  if (!order.reference || order.recipient !== merchant) return { ok: false, reason: "Order is not a wallet payment for this store" }
  const signature = signatureHint || (await findSignature(order.reference))
  if (!signature) return { ok: false, reason: "Payment not found yet", pending: true }

  const tx = await connection().getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 })
  if (!tx) return { ok: false, reason: "Transaction not confirmed yet", pending: true }
  if (tx.meta?.err) return { ok: false, reason: "Transaction failed on-chain" }
  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58())
  if (!keys.includes(order.reference)) return { ok: false, reason: "Transaction is not for this order" }
  if (paidAmount(tx, order, merchant, usdcMint) < BigInt(order.amount)) return { ok: false, reason: "Paid amount is lower than the order total" }
  return { ok: true, signature }
}
