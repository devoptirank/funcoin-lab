import "server-only"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { adminDb, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import type { AdminContext } from "@/lib/admin/guard"

/** Server-side moderation steps shared by the content routes and the reports queue. */

export const reasonSchema = z.string().trim().min(3, "Add a reason (at least 3 characters)").max(300)
export const projectIdSchema = z.string().trim().min(1).max(100)

/** Public pages that list or show sites (Discover picks, sitemap, the site itself). */
export function refreshPublicSite(slug?: string | null) {
  try {
    revalidatePath("/discover")
    revalidatePath("/sitemap.xml")
    if (slug) revalidatePath(`/site/${slug}`)
  } catch {
    // Revalidation is best effort; pages also refresh on their own schedule.
  }
}

async function projectSlug(id: string): Promise<string | null> {
  const { data } = await adminDb().from("projects").select("slug").eq("id", id).maybeSingle()
  return (data?.slug as string | undefined) ?? null
}

export async function moderateProject(ctx: AdminContext, id: string, status: "ok" | "hidden" | "removed", reason: string) {
  await adminRpc("admin_moderate_project", { p_actor: actor(ctx), p_project: id, p_status: status, p_reason: reason })
  refreshPublicSite(await projectSlug(id))
}

/**
 * Hide or remove a generated image. Removing also deletes the file from the public `generated`
 * bucket (after the row is marked, so a failed delete never leaves a visible row).
 */
export async function moderateAsset(ctx: AdminContext, id: string, status: "ok" | "hidden" | "removed", reason: string): Promise<{ fileDeleted: boolean | null }> {
  const path = await adminRpc<string | null>("admin_moderate_asset", { p_actor: actor(ctx), p_asset: id, p_status: status, p_reason: reason })
  if (status !== "removed" || !path) return { fileDeleted: null }
  const { error } = await adminDb().storage.from("generated").remove([path])
  if (error) console.error("[admin-content] storage delete failed:", error.message)
  return { fileDeleted: !error }
}
