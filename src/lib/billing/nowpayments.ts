import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { Order } from "./store"

// NOWPayments hosted invoices: the customer pays in any supported coin on NOWPayments' page; NOWPayments
// then calls our IPN webhook. We grant credits ONLY from a correctly signed IPN with status "finished".

const base = () =>
  process.env.NOWPAYMENTS_API_BASE?.trim() ||
  (process.env.NOWPAYMENTS_SANDBOX === "true" ? "https://api-sandbox.nowpayments.io/v1" : "https://api.nowpayments.io/v1")

export const nowPaymentsEnabled = () => Boolean(process.env.NOWPAYMENTS_API_KEY?.trim() && process.env.NOWPAYMENTS_IPN_SECRET?.trim())

export async function createInvoice(order: Order, siteUrl: string): Promise<{ id: string; url: string }> {
  const res = await fetch(`${base()}/invoice`, {
    method: "POST",
    headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!.trim(), "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      price_amount: order.usd,
      price_currency: "usd",
      order_id: order.id,
      order_description: `FunCoin Lab: ${order.credits} credits`,
      ipn_callback_url: `${siteUrl}/api/billing/nowpayments/ipn`,
      success_url: `${siteUrl}/dashboard/billing?order=${order.id}`,
      cancel_url: `${siteUrl}/pricing?cancelled=1`,
    }),
  })
  const json = (await res.json().catch(() => ({}))) as { id?: string | number; invoice_url?: string; message?: string }
  if (!res.ok || !json.invoice_url || json.id == null) throw new Error(json.message || `NOWPayments error ${res.status}`)
  return { id: String(json.id), url: json.invoice_url }
}

/**
 * Same algorithm as NOWPayments' reference code: JSON.stringify(body, Object.keys(body).sort()),
 * HMAC-SHA512 with the IPN secret, hex, compared to the x-nowpayments-sig header.
 */
export function signIpn(body: Record<string, unknown>, secret: string) {
  return createHmac("sha512", secret).update(JSON.stringify(body, Object.keys(body).sort())).digest("hex")
}

export function verifyIpn(body: Record<string, unknown>, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim()
  if (!secret || !signature) return false
  const expected = Buffer.from(signIpn(body, secret), "hex")
  const given = Buffer.from(signature.trim().toLowerCase(), "hex")
  return expected.length === given.length && timingSafeEqual(expected, given)
}
