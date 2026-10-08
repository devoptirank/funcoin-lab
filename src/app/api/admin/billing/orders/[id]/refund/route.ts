import { z } from "zod"
import { adminDb, adminRpc, adminRoute } from "@/lib/admin/api"
import { actor, auditEvent } from "@/lib/admin/audit"
import { fail, loadOrder, reasonField, type IdContext } from "@/components/admin/billing/order-route"

const schema = z.object({
  reason: reasonField,
  amount: z.string().trim().min(1, "Enter the amount refunded").max(60),
  txSignature: z.string().trim().min(3, "Enter the refund transaction signature or provider refund id").max(140),
})

/**
 * Record a refund that was sent manually from the merchant wallet. The panel never sends funds.
 * It removes the order's UNSPENT credits, min(order.credits, current balance), with one negative
 * ledger entry (ref refund:<orderId>, so it can only happen once) through admin_adjust_credits,
 * which writes the audit row in the same transaction. If the balance is already 0 nothing changes
 * and an "order.refund_recorded" audit event is written instead. Always needs a wallet step-up.
 */
export async function POST(req: Request, { params }: IdContext) {
  const { id } = await params
  return adminRoute(
    req,
    {
      permission: "orders.refund",
      schema,
      stepUp: (input) => ({
        action: "order.refund",
        summary: `Record a refund of ${input.amount} for order ${id} (tx ${input.txSignature}) and remove its unspent credits. Reason: ${input.reason}`,
        params: { orderId: id, amount: input.amount, txSignature: input.txSignature, reason: input.reason },
      }),
    },
    async (ctx, input, signature) => {
      const sb = adminDb()
      const order = await loadOrder(id)
      if (order.status !== "paid") throw fail(`Only paid orders can be refunded. This order is ${order.status}.`, 409)

      const ref = `refund:${order.id}`
      const { data: existing, error: exErr } = await sb.from("credit_ledger").select("id").eq("ref", ref).maybeSingle()
      if (exErr) throw fail(exErr.message, 500)
      if (existing) throw fail("A refund was already recorded for this order. Nothing changed.", 409)
      const { data: prior } = await sb.from("admin_audit").select("id").eq("action", "order.refund_recorded").eq("target_type", "order").eq("target_id", order.id).limit(1)
      if (prior?.length) throw fail("A refund was already recorded for this order. Nothing changed.", 409)

      const balance = Number(await adminRpc("billing_balance", { p_account: order.accountId })) || 0
      const remove = Math.max(0, Math.min(order.credits, balance))
      const text = `Refund for order ${order.id}: ${input.amount}, tx ${input.txSignature}. ${input.reason}`

      if (remove > 0) {
        const rows = await adminRpc<{ ok: boolean; balance: number }[]>("admin_adjust_credits", {
          p_actor: actor(ctx, signature ?? undefined),
          p_account: order.accountId,
          p_delta: -remove,
          p_reason: text,
          p_ref: ref,
        })
        const row = rows?.[0]
        if (!row?.ok) throw fail("A refund was already recorded for this order. Nothing changed.", 409)
        return { result: "refunded", removed: remove, balance: row.balance, message: `Refund recorded. Removed ${remove} unspent credits (balance now ${row.balance}).` }
      }

      await auditEvent(ctx, {
        action: "order.refund_recorded",
        targetType: "order",
        targetId: order.id,
        params: { account: order.accountId, amount: input.amount, txSignature: input.txSignature, creditsRemoved: 0, balance, stepUpSignature: signature },
        reason: text,
      })
      return { result: "recorded", removed: 0, balance, message: "Refund recorded. The balance was already 0, so no credits were removed." }
    },
  )
}
