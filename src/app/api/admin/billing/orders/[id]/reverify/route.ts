import { z } from "zod"
import { adminRoute } from "@/lib/admin/api"
import { auditEvent } from "@/lib/admin/audit"
import { getBillingStore } from "@/lib/billing/store"
import { verifyWalletPayment } from "@/lib/billing/solana"
import { fail, loadOrder, reasonField, type IdContext } from "@/components/admin/billing/order-route"

const schema = z.object({
  reason: reasonField,
  // Optional transaction signature pasted by the admin. Empty means "use the stored one or search by reference".
  signature: z
    .string()
    .trim()
    .max(120)
    .refine((s) => s === "" || /^[1-9A-HJ-NP-Za-km-z]{40,120}$/.test(s), "is not a valid Solana transaction signature")
    .default(""),
})

/**
 * Re-run the on-chain check for a SOL/USDC order, exactly as the customer confirm route does
 * (verifyWalletPayment), and fulfil it through billing_fulfill_order only when the transaction is
 * valid. Safe to repeat: a paid order is never touched again, and fulfilment is pending -> paid once.
 */
export async function POST(req: Request, { params }: IdContext) {
  const { id } = await params
  return adminRoute(req, { permission: "orders.reverify", schema }, async (ctx, input) => {
    const order = await loadOrder(id)
    if (order.method === "nowpayments") throw fail("This is a NOWPayments order. Use Re-check NOWPayments instead.")
    if (order.status === "paid") return { result: "already_paid", message: "Order is already paid. Nothing changed." }

    const store = getBillingStore()
    const hint = input.signature || order.signature || undefined
    const record = (outcome: string, extra: Record<string, unknown> = {}) =>
      auditEvent(ctx, {
        action: "order.reverify",
        targetType: "order",
        targetId: order.id,
        params: { outcome, account: order.accountId, method: order.method, signature: hint ?? null, ...extra },
        reason: input.reason,
      })

    let verdict: Awaited<ReturnType<typeof verifyWalletPayment>>
    try {
      verdict = await verifyWalletPayment(order, hint)
    } catch (error) {
      console.error("[admin-billing] reverify RPC error:", error instanceof Error ? error.message : error)
      throw fail("Couldn't reach the Solana network. Nothing changed; try again in a moment.", 502)
    }

    if (!verdict.ok) {
      await record(verdict.pending ? "not_found" : "mismatch", { detail: verdict.reason })
      throw fail(`${verdict.pending ? "Not found" : "Not valid"}: ${verdict.reason}. Order not marked paid.`, 422)
    }
    if (await store.signatureUsed(verdict.signature)) {
      await record("signature_used", { signature: verdict.signature })
      throw fail("That transaction already paid for another order. Order not marked paid.", 409)
    }
    const changed = await store.fulfillOrder(order.id, { signature: verdict.signature })
    await record(changed ? "paid" : "already_paid", { signature: verdict.signature, credits: order.credits })
    return {
      result: changed ? "paid" : "already_paid",
      signature: verdict.signature,
      message: changed ? `Verified on-chain. Order marked paid and ${order.credits} credits granted.` : "Order was already paid. Nothing changed.",
    }
  })
}
