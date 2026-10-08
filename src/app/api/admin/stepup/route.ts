import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminApi } from "@/lib/admin/guard"
import { issueStepUp } from "@/lib/admin/stepup"
import { requestHost } from "@/lib/hosts"

const schema = z.object({ action: z.string().min(1).max(60), summary: z.string().min(1).max(400), params: z.record(z.string(), z.unknown()) })

/** Issue the message for a step-up signature. The action route re-derives and checks it. */
export async function POST(req: Request) {
  const ctx = await requireAdminApi(req, "admin.view")
  if (ctx instanceof NextResponse) return ctx
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  return NextResponse.json(await issueStepUp(ctx, parsed.data, requestHost(req)), { headers: { "Cache-Control": "no-store" } })
}
