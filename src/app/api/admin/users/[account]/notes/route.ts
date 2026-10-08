import { NextResponse } from "next/server"
import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { parseAccountParam } from "@/components/admin/users/users-query"

const schema = z.object({
  notes: z.string().max(4000),
  reason: z.string().trim().min(3).max(300),
})

/** Replace the internal notes on a wallet (admins only see them). */
export async function POST(req: Request, { params }: { params: Promise<{ account: string }> }) {
  const account = parseAccountParam((await params).account)
  if (!account) return new NextResponse("Not Found", { status: 404 })
  return adminRoute(req, { permission: "accounts.notes", schema }, async (ctx, input) => {
    const notes = input.notes.trim()
    await adminRpc("admin_set_account_notes", { p_actor: actor(ctx), p_account: account, p_notes: notes || null, p_reason: input.reason })
    return { ok: true }
  })
}
