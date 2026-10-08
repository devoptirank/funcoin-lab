import "server-only"

/**
 * Read-only NOWPayments lookup for the admin "Re-check" action. Uses the same base URL rules and
 * x-api-key header as src/lib/billing/nowpayments.ts (its base() helper isn't exported, so the
 * rule is repeated here). Only GET requests; nothing is ever created or changed at NOWPayments.
 */

const base = () =>
  process.env.NOWPAYMENTS_API_BASE?.trim() ||
  (process.env.NOWPAYMENTS_SANDBOX === "true" ? "https://api-sandbox.nowpayments.io/v1" : "https://api.nowpayments.io/v1")

export const nowPaymentsApiKeySet = () => Boolean(process.env.NOWPAYMENTS_API_KEY?.trim())

export type NowPayment = {
  payment_id?: string | number
  invoice_id?: string | number | null
  order_id?: string | null
  payment_status?: string
  price_amount?: number | string
  price_currency?: string
  pay_amount?: number | string
  actually_paid?: number | string
  pay_currency?: string
  updated_at?: string
}

/** GET /payment/{id}. Returns the payment, or an error message for 404s and API errors. */
export async function getNowPayment(paymentId: string): Promise<{ ok: true; payment: NowPayment } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${base()}/payment/${encodeURIComponent(paymentId)}`, {
      headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!.trim() },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    })
    const json = (await res.json().catch(() => ({}))) as NowPayment & { message?: string }
    if (!res.ok) return { ok: false, error: json.message || `NOWPayments returned ${res.status}` }
    return { ok: true, payment: json }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `Couldn't reach NOWPayments: ${error.message}` : "Couldn't reach NOWPayments" }
  }
}
