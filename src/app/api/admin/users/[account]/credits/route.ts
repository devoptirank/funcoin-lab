import { NextResponse } from "next/server"
import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { can } from "@/lib/admin/permissions"
import { getSetting } from "@/lib/settings"
import { parseAccountParam } from "@/components/admin/users/users-query"

const schema = z.object({
  delta: z.number().int("must be a whole number").min(-1_000_000).max(1_000_000).refine((n) => n !== 0, "must not be zero"),
  reason: z.string().trim().min(3).max(300),
})

/** Grant (+) or deduct (-) credits. Over the support cap: admins and owners only, with a wallet signature. */
export async function POST(req: Request, { params }: { params: Promise<{ account: string }> }) {
  const account = parseAccountParam((await params).account)
  if (!account) return new NextResponse("Not Found", { status: 404 })
  const { supportCreditCap: cap } = await getSetting("limits")
  return adminRoute(
    req,
    {
      permission: "credits.adjust",
      schema,
      stepUp: (input, ctx) => {
        if (Math.abs(input.delta) <= cap) return null
        if (!can(ctx.role, "credits.adjust.large")) {
          throw Object.assign(new Error(`Changes above ${cap} credits need an admin or owner. Use a smaller amount or ask an admin.`), { status: 403 })
        }
        const verb = input.delta > 0 ? `Grant ${input.delta}` : `Deduct ${-input.delta}`
        return { action: "credits.adjust", summary: `${verb} credits ${input.delta > 0 ? "to" : "from"} ${account}. Reason: ${input.reason}`, params: { account, delta: input.delta, reason: input.reason } }
      },
    },
    async (ctx, input, signature) => {
      const rows = await adminRpc<{ ok: boolean; balance: number }[]>("admin_adjust_credits", {
        p_actor: actor(ctx, signature ?? undefined),
        p_account: account,
        p_delta: input.delta,
        p_reason: input.reason,
        p_ref: `admin:${crypto.randomUUID()}`,
      })
      const row = Array.isArray(rows) ? rows[0] : null
      return { ok: Boolean(row?.ok), balance: row?.balance ?? null }
    },
  )
}
