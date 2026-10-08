import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { envOwners } from "@/lib/admin/guard"
import { accountId, reason, shortAccount } from "@/components/admin/ops/team-schema"

const schema = z.object({ account: accountId, reason })

/** Disable an admin. Takes effect on their next request. Owners only, always wallet signed. */
export const POST = (req: Request) =>
  adminRoute(
    req,
    {
      permission: "admins.manage",
      schema,
      stepUp: (i) => ({ action: "admin.disable", summary: `Disable admin ${shortAccount(i.account)}. Reason: ${i.reason}`.slice(0, 400), params: { account: i.account, reason: i.reason } }),
    },
    async (ctx, i, signature) => {
      if (i.account === ctx.account) throw Object.assign(new Error("You can't disable yourself."), { status: 400 })
      const protectedOwners = [...envOwners()]
      if (protectedOwners.includes(i.account)) throw Object.assign(new Error("This wallet is an owner from ADMIN_WALLETS and can't be disabled here."), { status: 400 })
      await adminRpc("admin_disable_admin", { p_actor: actor(ctx, signature ?? undefined), p_account: i.account, p_reason: i.reason, p_protected: protectedOwners })
      return { ok: true }
    },
  )
