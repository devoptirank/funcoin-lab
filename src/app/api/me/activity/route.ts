import { z } from "zod"
import { recordActivity } from "@/lib/data/server"
import { body, withAccount } from "@/lib/data/route"

const schema = z.object({ kind: z.enum(["idea", "meme", "bios", "content"]), input: z.unknown(), output: z.unknown() })

export const POST = (req: Request) =>
  withAccount(req, async (s) => {
    const input = await body(req, schema)
    if (input instanceof Response) return input
    await recordActivity(s.accountId, input.kind, input.input, input.output)
  })
