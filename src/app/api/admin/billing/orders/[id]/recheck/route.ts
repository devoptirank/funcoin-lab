import { z } from "zod"
import { adminDb, adminRoute } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { getBillingStore } from "@/lib/billing/store"
import { getNowPayment, nowPaymentsApiKeySet, type NowPayment } from "@/components/admin/billing/nowpayments-status"
import { fail, loadOrder, reasonField, type IdContext } from "@/components/admin/billing/order-route"

const schema = z.object({
  reason: reasonField,
  // Optional NOWPayments payment id (numeric) from their dashboard.
  paymentId: z
    .string()
    .trim()
    .refine((s) => s === "" || /^\d{1,24}$/.test(s), "must be a numeric NOWPayments payment id")
    .default(""),
})

/**
 * Ask NOWPayments for the payment status of a NOWPayments order. Fulfils (billing_fulfill_order)
 * only when the payment belongs to this order, its status is "finished", price_amount >= order.usd
 * and price_currency is usd: the same rule as the IPN webhook. Otherwise nothing changes.
 *
 * Unpaid orders store the NOWPayments INVOICE id in provider_id; GET /payment/{id} needs a PAYMENT
 * id. Payment ids come from the admin (pasted) or from this order's logged IPN bodies.
 */
export async function POST(req: Request, { params }: IdContext) {
  const { id } = await params
  return adminRoute(req, { permission: "orders.reverify", schema }, async (ctx, input) => {
    const order = await loadOrder(id)
    if (order.method !== "nowpayments") throw fail("This is a wallet (SOL/USDC) order. Use Re-verify instead.")
    if (order.status === "paid") return { result: "already_paid", message: "Order is already paid. Nothing changed." }
    if (!nowPaymentsApiKeySet()) throw fail("NOWPAYMENTS_API_KEY isn't set on this deployment, so NOWPayments can't be queried.", 503)

    const record = (outcome: string, extra: Record<string, unknown> = {}) =>
      auditEvent(ctx, {
        action: "order.recheck",
        targetType: "order",
        targetId: order.id,
        params: { outcome, account: order.accountId, invoiceId: order.providerId, ...extra },
        reason: input.reason,
      })

    // Candidate payment ids: the pasted one first, then any seen in this order's IPN log.
    const candidates: string[] = []
    if (input.paymentId) candidates.push(input.paymentId)
    const { data: events } = await adminDb()
      .from("payment_events")
      .select("body, created_at")
      .eq("provider", "nowpayments")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(50)
    for (const e of (events ?? []) as { body: { payment_id?: unknown } | null }[]) {
      const pid = e.body?.payment_id
      if ((typeof pid === "string" || typeof pid === "number") && /^\d{1,24}$/.test(String(pid)) && !candidates.includes(String(pid))) candidates.push(String(pid))
    }

    if (!candidates.length) {
      await record("invoice_only")
      throw fail(
        `Only the NOWPayments invoice id (${order.providerId ?? "none"}) is known for this order, and no IPN with a payment id was logged. ` +
          `NOWPayments' payment status API needs a payment id, so nothing was checked or changed. ` +
          `Find the payment for order ${order.id} in the NOWPayments dashboard and paste its payment id.`,
        422,
      )
    }

    const seen: string[] = []
    let finishedMismatch: NowPayment | null = null
    for (const pid of candidates.slice(0, 5)) {
      const res = await getNowPayment(pid)
      if (!res.ok) {
        seen.push(`${pid}: ${res.error}`)
        continue
      }
      const p = res.payment
      if (String(p.order_id ?? "") !== order.id) {
        seen.push(`${pid}: belongs to another order (${p.order_id ?? "none"})`)
        continue
      }
      const status = String(p.payment_status ?? "unknown")
      if (status !== "finished") {
        seen.push(`${pid}: status ${status}`)
        continue
      }
      const priceOk = Number(p.price_amount) >= order.usd && String(p.price_currency ?? "").toLowerCase() === "usd"
      if (!priceOk) {
        finishedMismatch = p
        seen.push(`${pid}: finished but price ${p.price_amount} ${p.price_currency} does not cover $${order.usd} USD`)
        continue
      }
      const paymentId = String(p.payment_id ?? pid)
      const changed = await getBillingStore().fulfillOrder(order.id, { providerId: paymentId })
      await record(changed ? "paid" : "already_paid", { paymentId, status, priceAmount: p.price_amount, priceCurrency: p.price_currency })
      return {
        result: changed ? "paid" : "already_paid",
        paymentId,
        message: changed ? `NOWPayments reports payment ${paymentId} finished. Order marked paid and ${order.credits} credits granted.` : "Order was already paid. Nothing changed.",
      }
    }

    await record(finishedMismatch ? "mismatch" : "not_paid", { checked: seen })
    throw fail(`Not marked paid. ${seen.join("; ")}.`, 422)
  })
}
