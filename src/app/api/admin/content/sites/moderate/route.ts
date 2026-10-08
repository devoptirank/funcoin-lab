import { z } from "zod"
import { adminRoute } from "@/lib/admin/api"
import { moderateProject, projectIdSchema, reasonSchema } from "@/components/admin/content/actions"

/** Hide, remove or restore a site. The reason is saved as moderation_reason, which the owner sees. */
export const POST = (req: Request) =>
  adminRoute(
    req,
    { permission: "content.moderate", schema: z.object({ projectId: projectIdSchema, status: z.enum(["ok", "hidden", "removed"]), reason: reasonSchema }) },
    async (ctx, input) => {
      await moderateProject(ctx, input.projectId, input.status, input.reason)
      return { ok: true }
    },
  )
