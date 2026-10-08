import { z } from "zod"
import { adminRoute } from "@/lib/admin/api"
import { moderateAsset, reasonSchema } from "@/components/admin/content/actions"

/** Remove a generated image: mark the row removed, then delete the file from the `generated` bucket. */
export const POST = (req: Request) =>
  adminRoute(req, { permission: "content.moderate", schema: z.object({ assetId: z.uuid(), reason: reasonSchema }) }, async (ctx, input) => {
    const { fileDeleted } = await moderateAsset(ctx, input.assetId, "removed", input.reason)
    return { ok: true, fileDeleted, warning: fileDeleted === false ? "The image is marked removed, but deleting the file failed. Try again later." : undefined }
  })
