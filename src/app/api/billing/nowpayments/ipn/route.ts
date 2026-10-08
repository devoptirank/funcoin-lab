import { NextResponse } from "next/server"
import { billingAvailable, getBillingStore } from "@/lib/billing/store"
import { verifyIpn } from "@/lib/billing/nowpayments"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

// NOWPayments IPN webhook. Credits are granted only for a correctly signed "finished" payment whose
// amount and currency match the order. Every event is logged (Supabase payment_events when available).
export async function POST(req: Request) {
  // 503 makes NOWPayments retry later instead of us dropping the payment.
  if (!billingAvailable()) return NextResponse.json({ error: "Ledger unavailable" }, { status: 503 })
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || !verifyIpn(body, req.headers.get("x-nowpayments-sig"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
  const orderId = String(body.order_id ?? "")
  const status = String(body.payment_status ?? "")
  await getSupabaseAdmin()?.from("payment_events").insert({ provider: "nowpayments", order_id: orderId, status, body }).then(
    () => undefined,
    () => undefined,
  )
  console.info(`[nowpayments] IPN ${orderId}: ${status}`)

  const store = getBillingStore()
  const order = await store.getOrder(orderId)
  if (!order || order.method !== "nowpayments") return NextResponse.json({ ok: true, ignored: "unknown order" })

  const priceOk = Number(body.price_amount) >= order.usd && String(body.price_currency ?? "").toLowerCase() === "usd"
  switch (status) {
    case "finished":
      if (!priceOk) {
        await store.setOrderStatus(order.id, "failed")
        console.error(`[nowpayments] amount/currency mismatch on ${order.id}`)
        break
      }
      await store.fulfillOrder(order.id, { providerId: String(body.payment_id ?? order.providerId ?? "") || null })
      break
    case "partially_paid":
      await store.setOrderStatus(order.id, "partial")
      break
    case "failed":
    case "refunded":
      await store.setOrderStatus(order.id, "failed")
      break
    case "expired":
      await store.setOrderStatus(order.id, "expired")
      break
    default:
      // waiting / confirming / confirmed / sending: keep pending until "finished".
      break
  }
  return NextResponse.json({ ok: true })
}
