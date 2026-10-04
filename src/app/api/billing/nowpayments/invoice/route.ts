import { NextResponse } from "next/server"
import { z } from "zod"
import { packById } from "@/lib/billing/plans"
import { getBillingStore, type Order } from "@/lib/billing/store"
import { requireSession, siteOrigin } from "@/lib/billing/server"
import { createInvoice, nowPaymentsEnabled } from "@/lib/billing/nowpayments"
import { clientKey, rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (!nowPaymentsEnabled()) return NextResponse.json({ error: "Crypto checkout (NOWPayments) isn't configured yet." }, { status: 503 })
  if (!rateLimit(clientKey(req, "np-invoice"), 6, 60_000).ok) return NextResponse.json({ error: "Too many checkouts. Wait a minute." }, { status: 429 })
  const parsed = z.object({ packId: z.string() }).safeParse(await req.json().catch(() => null))
  const pack = parsed.success ? packById(parsed.data.packId) : undefined
  if (!pack) return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 })

  const order: Order = {
    id: `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    accountId: session.accountId,
    packId: pack.id,
    credits: pack.credits,
    usd: pack.usd,
    method: "nowpayments",
    amount: pack.usd.toFixed(2),
    currency: "USD",
    recipient: null,
    reference: null,
    signature: null,
    providerId: null,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    paidAt: null,
  }
  const store = getBillingStore()
  await store.createOrder(order)
  try {
    const invoice = await createInvoice(order, siteOrigin(req))
    await store.setOrderStatus(order.id, "pending", { providerId: invoice.id })
    return NextResponse.json({ orderId: order.id, invoiceUrl: invoice.url })
  } catch (error) {
    console.error("[billing] NOWPayments invoice failed:", error instanceof Error ? error.message : error)
    await store.setOrderStatus(order.id, "failed")
    return NextResponse.json({ error: "Couldn't start the crypto checkout. Please try again." }, { status: 502 })
  }
}
