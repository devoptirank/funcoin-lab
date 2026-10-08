import { NextResponse } from "next/server"
import { z } from "zod"
import { getAdminState } from "@/lib/admin/guard"
import { createAdminSession, verifyAdminSignIn } from "@/lib/admin/session"
import { auditEvent } from "@/lib/admin/audit"
import { getBillingStore } from "@/lib/billing/store"
import { requestHost } from "@/lib/hosts"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const schema = z.object({ signature: z.string().min(40).max(120), token: z.string().min(20).max(2000) })
const hidden = () => new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } })

/** Finish the step-up sign-in: verify the admin message signature, then set the host-only admin cookie. */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "admin-verify"), 10, 60_000).ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  const s = await getAdminState()
  if (s.state !== "needs-step-up" && s.state !== "ok") return hidden()
  const who = s.state === "ok" ? { account: s.ctx.account, address: s.ctx.address, role: s.ctx.role } : s
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  try {
    const { nonce, expiresAt } = await verifyAdminSignIn({ domain: requestHost(req), address: who.address, ...parsed.data })
    if (!(await getBillingStore().consumeNonce(`admin:${nonce}`, expiresAt))) return NextResponse.json({ error: "This sign-in request was already used" }, { status: 400 })
    await createAdminSession(who.account)
    const h = req.headers
    await auditEvent(
      { account: who.account, role: who.role, ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim(), userAgent: (h.get("user-agent") ?? "").slice(0, 300) },
      { action: "admin.signin", reason: "Admin step-up sign-in" },
    )
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[admin] step-up failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Admin sign-in failed" }, { status: 401 })
  }
}
