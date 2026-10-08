import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { envOwners } from "@/lib/admin/guard"
import { ADMIN_ROLES } from "@/lib/admin/permissions"
import { accountId, reason, shortAccount } from "@/components/admin/ops/team-schema"

const schema = z.object({ address: accountId, role: z.enum(ADMIN_ROLES), reason })

/**
 * Add an admin or change an admin's role (re-enables a disabled one). Owners only, always wallet
 * signed. Env owners (ADMIN_WALLETS) can't be changed here; the SQL function enforces it too.
 */
export const POST = (req: Request) =>
  adminRoute(
    req,
    {
      permission: "admins.manage",
      schema,
      stepUp: (i) => ({ action: "admin.upsert", summary: `Set ${shortAccount(i.address)} as ${i.role} admin. Reason: ${i.reason}`.slice(0, 400), params: { account: i.address, role: i.role, reason: i.reason } }),
    },
    async (ctx, i, signature) => {
      if (i.address === ctx.account) throw Object.assign(new Error("You can't change your own role."), { status: 400 })
      const protectedOwners = [...envOwners()]
      if (protectedOwners.includes(i.address)) throw Object.assign(new Error("This wallet is an owner from ADMIN_WALLETS and can't be changed here."), { status: 400 })
      await adminRpc("admin_upsert_admin", { p_actor: actor(ctx, signature ?? undefined), p_account: i.address, p_role: i.role, p_reason: i.reason, p_protected: protectedOwners })
      return { ok: true }
    },
  )
