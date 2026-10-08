import { NextResponse } from "next/server"
import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { forgetAccountStatus } from "@/lib/admin/account-status"
import { parseAccountParam } from "@/components/admin/users/users-query"

const schema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
  reason: z.string().trim().min(3).max(300),
})

/** Suspend, ban or reinstate (active) a wallet. Bans always need a wallet signature. */
export async function POST(req: Request, { params }: { params: Promise<{ account: string }> }) {
  const account = parseAccountParam((await params).account)
  if (!account) return new NextResponse("Not Found", { status: 404 })
  return adminRoute(
    req,
    {
      permission: "accounts.status",
      schema,
      stepUp: (input) =>
        input.status === "banned" ? { action: "account.ban", summary: `Ban ${account}. Reason: ${input.reason}`, params: { account, status: "banned", reason: input.reason } } : null,
    },
    async (ctx, input, signature) => {
      if (account === ctx.account) throw Object.assign(new Error("You can't change the status of your own wallet."), { status: 400 })
      await adminRpc("admin_set_account_status", { p_actor: actor(ctx, signature ?? undefined), p_account: account, p_status: input.status, p_reason: input.reason })
      forgetAccountStatus(account)
      return { ok: true, status: input.status }
    },
  )
}
