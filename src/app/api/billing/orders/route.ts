import { NextResponse } from "next/server"
import { z } from "zod"
import { Keypair } from "@solana/web3.js"
import { packById } from "@/lib/billing/plans"
import { getBillingStore, type Order } from "@/lib/billing/store"
import { requireSession } from "@/lib/billing/server"
import { solUsdPrice, solanaConfig, walletPaymentsEnabled } from "@/lib/billing/solana"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const schema = z.object({ packId: z.string(), method: z.enum(["sol", "usdc"]) })

/** Create a wallet-payment order with a unique reference key and a locked price (15 minutes). */
export async function POST(req: Request) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (!walletPaymentsEnabled()) return NextResponse.json({ error: "Wallet payments aren't configured yet." }, { status: 503 })
  if (!rateLimit(clientKey(req, "order"), 10, 60_000).ok) return NextResponse.json({ error: "Too many orders. Wait a minute." }, { status: 429 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  const pack = parsed.success ? packById(parsed.data.packId) : undefined
  if (!parsed.success || !pack) return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 })

  const { merchant, usdcMint, cluster } = solanaConfig()
  let amount: bigint
  let display: string
  try {
    if (parsed.data.method === "usdc") {
      amount = BigInt(Math.round(pack.usd * 1_000_000))
      display = `${pack.usd.toFixed(2)} USDC`
    } else {
      const price = await solUsdPrice()
      amount = BigInt(Math.ceil((pack.usd / price) * 1_000_000_000))
      display = `${(Number(amount) / 1e9).toFixed(4)} SOL`
    }
  } catch (error) {
    console.error("[billing] quote failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Couldn't get a SOL price right now. Try USDC or try again." }, { status: 503 })
  }

  const order: Order = {
    id: `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    accountId: session.accountId,
    packId: pack.id,
    credits: pack.credits,
    usd: pack.usd,
    method: parsed.data.method,
    amount: amount.toString(),
    currency: parsed.data.method === "usdc" ? "USDC" : "SOL",
    recipient: merchant,
    reference: Keypair.generate().publicKey.toBase58(),
    signature: null,
    providerId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    paidAt: null,
  }
  await getBillingStore().createOrder(order)
  return NextResponse.json({ order, display, mint: parsed.data.method === "usdc" ? usdcMint : null, cluster })
}
