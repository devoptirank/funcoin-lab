import { listAssets } from "@/lib/data/server"
import { projectIdSchema, withAccount } from "@/lib/data/route"

export const GET = (req: Request) =>
  withAccount(req, async (s) => {
    const conceptId = projectIdSchema.safeParse(new URL(req.url).searchParams.get("conceptId"))
    return conceptId.success ? listAssets(s.accountId, conceptId.data) : []
  })
