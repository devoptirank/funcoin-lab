import { z } from "zod"
import { listBookmarks, toggleBookmark } from "@/lib/data/server"
import { body, withAccount } from "@/lib/data/route"

export const GET = (req: Request) => withAccount(req, (s) => listBookmarks(s.accountId))

export const POST = (req: Request) =>
  withAccount(req, async (s) => {
    const input = await body(req, z.object({ ref: z.string().regex(/^[a-z0-9-]{1,80}$/), data: z.unknown().optional() }))
    if (input instanceof Response) return input
    return { on: await toggleBookmark(s.accountId, input.ref, input.data) }
  })
