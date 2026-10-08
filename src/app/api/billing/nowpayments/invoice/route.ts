import { NextResponse } from "next/server"
import { z } from "zod"
import { getBillingStore, type Order } from "@/lib/billing/store"
import { appOrigin, billingUnavailable, requireSession, siteOrigin } from "@/lib/billing/server"
import { createInvoice, enabledCoins, nowPaymentsEnabled } from "@/lib/billing/nowpayments"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { featureGate, getSetting } from "@/lib/settings"

export async function POST(req: Request) {
  const offline = billingUnavailable()
  if (offline) return offline
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const off = await featureGate((f) => f.checkoutNowpayments, "Crypto checkout (NOWPayments)")
  if (off) return off
  if (!nowPaymentsEnabled()) return NextResponse.json({ error: "Crypto checkout (NOWPayments) isn't configured yet." }, { status: 503 })
  if (!rateLimit(clientKey(req, "np-invoice"), 6, 60_000).ok) return NextResponse.json({ error: "Too many checkouts. Wait a minute." }, { status: 429 })
  const parsed = z
    .object({ packId: z.string(), payCurrency: z.string().regex(/^[a-z0-9]{2,20}$/).optional() })
    .safeParse(await req.json().catch(() => null))
  // Packs come from admin Settings (billing/plans by default); the price is locked into the order.
  const pack = parsed.success ? (await getSetting("pricing")).packs.find((p) => p.id === parsed.data.packId) : undefined
  if (!parsed.success || !pack) return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 })
  const payCurrency = parsed.data.payCurrency
  if (payCurrency && !(await enabledCoins()).includes(payCurrency)) {
    return NextResponse.json({ error: "That coin isn't available right now. Pick another one." }, { status: 400 })
  }

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
    const invoice = await createInvoice(order, { site: siteOrigin(req), app: appOrigin(req) }, payCurrency)
    await store.setOrderStatus(order.id, "pending", { providerId: invoice.id })
    return NextResponse.json({ orderId: order.id, invoiceUrl: invoice.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[billing] NOWPayments invoice failed:", message)
    await store.setOrderStatus(order.id, "failed")
    // NOWPayments enforces per-coin minimums; small packs can be below them for some coins.
    const tooSmall = /minimal|minimum|less than/i.test(message)
    return NextResponse.json(
      { error: tooSmall ? "This pack is below the minimum for that coin. Choose a bigger pack or another coin." : "Couldn't start the crypto checkout. Please try again." },
      { status: tooSmall ? 400 : 502 },
    )
  }
}
