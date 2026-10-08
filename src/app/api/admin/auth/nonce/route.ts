import { NextResponse } from "next/server"
import { getAdminState } from "@/lib/admin/guard"
import { issueAdminNonce } from "@/lib/admin/session"
import { requestHost } from "@/lib/hosts"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const hidden = () => new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } })

/** Start the step-up admin sign-in. Only for wallets that already hold an admin role. */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "admin-nonce"), 10, 60_000).ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  const s = await getAdminState()
  if (s.state !== "needs-step-up" && s.state !== "ok") return hidden()
  const address = s.state === "ok" ? s.ctx.address : s.address
  const { message, token } = await issueAdminNonce(address, requestHost(req))
  return NextResponse.json({ message, token }, { headers: { "Cache-Control": "no-store" } })
}
