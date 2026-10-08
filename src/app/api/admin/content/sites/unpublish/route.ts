import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { projectIdSchema, reasonSchema, refreshPublicSite } from "@/components/admin/content/actions"

/** Take a site offline (published = false). The owner can publish it again unless it's moderated. */
export const POST = (req: Request) =>
  adminRoute(req, { permission: "sites.unpublish", schema: z.object({ projectId: projectIdSchema, slug: z.string().max(64).optional(), reason: reasonSchema }) }, async (ctx, input) => {
    await adminRpc("admin_unpublish_project", { p_actor: actor(ctx), p_project: input.projectId, p_reason: input.reason })
    refreshPublicSite(input.slug)
    return { ok: true }
  })
