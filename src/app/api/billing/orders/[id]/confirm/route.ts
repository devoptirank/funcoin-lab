import { NextResponse } from "next/server"
import { z } from "zod"
import { getBillingStore } from "@/lib/billing/store"
import { accountSnapshot, billingUnavailable, requireSession } from "@/lib/billing/server"
import { verifyWalletPayment } from "@/lib/billing/solana"

const schema = z.object({ signature: z.string().min(40).max(120).optional() })

/** Check the chain for this order's payment and grant credits once. Safe to call repeatedly. */
export async function POST(req: Request, ctx: RouteContext<"/api/billing/orders/[id]/confirm">) {
  const offline = billingUnavailable()
  if (offline) return offline
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const { id } = await ctx.params
  const store = getBillingStore()
  const order = await store.getOrder(id)
  if (!order || order.accountId !== session.accountId) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.status === "paid") return NextResponse.json({ status: "paid", ...(await accountSnapshot(session)) })
  if (order.method === "nowpayments") return NextResponse.json({ status: order.status })

  const body = schema.safeParse(await req.json().catch(() => ({})))
  const hint = body.success ? body.data.signature : undefined
  try {
    const verdict = await verifyWalletPayment(order, hint)
    if (!verdict.ok) {
      const expired = Date.parse(order.expiresAt) + 10 * 60_000 < Date.now()
      if (verdict.pending && expired) await store.setOrderStatus(order.id, "expired")
      return NextResponse.json({ status: verdict.pending ? (expired ? "expired" : "pending") : "failed", reason: verdict.reason }, { status: verdict.pending ? 202 : 400 })
    }
    if (await store.signatureUsed(verdict.signature)) return NextResponse.json({ status: "failed", reason: "That transaction was already used" }, { status: 400 })
    await store.fulfillOrder(order.id, { signature: verdict.signature })
    return NextResponse.json({ status: "paid", ...(await accountSnapshot(session)) })
  } catch (error) {
    console.error("[billing] confirm failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ status: "pending", reason: "Couldn't reach the Solana network. Retrying..." }, { status: 202 })
  }
}
