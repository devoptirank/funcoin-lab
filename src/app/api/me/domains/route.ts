import { z } from "zod"
import { listDomains, removeDomain, saveDomain } from "@/lib/data/server"
import { body, withAccount } from "@/lib/data/route"

const domain = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,63}\.fun$/)
const schema = z.object({
  domain,
  topic: z.string().max(120).default(""),
  status: z.enum(["unchecked", "unknown", "registered", "no-record", "available", "error"]).catch("unchecked"),
})

export const GET = (req: Request) => withAccount(req, (s) => listDomains(s.accountId))

export const POST = (req: Request) =>
  withAccount(req, async (s) => {
    const input = await body(req, schema)
    if (input instanceof Response) return input
    await saveDomain(s.accountId, input)
  })

export const DELETE = (req: Request) =>
  withAccount(req, async (s) => {
    const d = domain.safeParse(new URL(req.url).searchParams.get("domain"))
    if (d.success) await removeDomain(s.accountId, d.data)
  })
