import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { projectIdSchema, reasonSchema, refreshPublicSite } from "@/components/admin/content/actions"

/** Feature or unfeature a site in Discover "Community picks". Editorial only, never paid placement. */
export const POST = (req: Request) =>
  adminRoute(req, { permission: "content.feature", schema: z.object({ projectId: projectIdSchema, featured: z.boolean(), reason: reasonSchema }) }, async (ctx, input) => {
    await adminRpc("admin_set_featured", { p_actor: actor(ctx), p_project: input.projectId, p_featured: input.featured, p_reason: input.reason })
    refreshPublicSite()
    return { ok: true }
  })
