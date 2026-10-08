import { NextResponse } from "next/server"
import { z } from "zod"
import { adminDb, adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { parseAccountParam } from "@/components/admin/users/users-query"

const schema = z.object({ reason: z.string().trim().min(3).max(300) })

/** Unpublish every published site the wallet owns. Each project gets its own audit row. */
export async function POST(req: Request, { params }: { params: Promise<{ account: string }> }) {
  const account = parseAccountParam((await params).account)
  if (!account) return new NextResponse("Not Found", { status: 404 })
  return adminRoute(req, { permission: "sites.unpublish", schema }, async (ctx, input) => {
    const { data, error } = await adminDb().from("projects").select("id").eq("account_id", account).eq("published", true).limit(500)
    if (error) throw new Error(error.message)
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    if (!ids.length) throw Object.assign(new Error("This wallet has no published sites."), { status: 400 })
    let done = 0
    for (const id of ids) {
      try {
        await adminRpc("admin_unpublish_project", { p_actor: actor(ctx), p_project: id, p_reason: input.reason })
        done++
      } catch (e) {
        const message = e instanceof Error ? e.message : "failed"
        throw Object.assign(new Error(`Unpublished ${done} of ${ids.length} sites, then stopped: ${message}`), { status: 500 })
      }
    }
    return { ok: true, unpublished: done }
  })
}
