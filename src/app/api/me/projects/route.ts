import { z } from "zod"
import type { MemeConcept, SiteConfig } from "@/lib/types"
import { listProjects, saveProject } from "@/lib/data/server"
import { body, projectIdSchema, withAccount } from "@/lib/data/route"

const schema = z.object({
  id: projectIdSchema,
  slug: z.string().max(80).default(""),
  concept: z.looseObject({ name: z.string().min(1).max(80) }),
  site: z.looseObject({}).nullable(),
})

export const GET = (req: Request) => withAccount(req, (s) => listProjects(s.accountId))

export const POST = (req: Request) =>
  withAccount(req, async (s) => {
    const input = await body(req, schema)
    if (input instanceof Response) return input
    return saveProject(s.accountId, { id: input.id, slug: input.slug, concept: input.concept as unknown as MemeConcept, site: input.site as unknown as SiteConfig | null })
  })
