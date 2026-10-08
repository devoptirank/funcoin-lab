import { z } from "zod"
import { removeAsset } from "@/lib/data/server"
import { withAccount } from "@/lib/data/route"

export const DELETE = (req: Request, ctx: RouteContext<"/api/me/assets/[id]">) =>
  withAccount(req, async (s) => {
    const { id } = await ctx.params
    if (z.uuid().safeParse(id).success) await removeAsset(s.accountId, id)
  })
