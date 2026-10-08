import { requestHost } from "@/lib/hosts"
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildSignInMessage, issueNonce } from "@/lib/auth/siws"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const schema = z.object({ address: z.string().min(32).max(44) })

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "auth-nonce"), 20, 60_000).ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  try {
    const { nonce, issuedAt, token } = await issueNonce(parsed.data.address)
    const domain = requestHost(req)
    return NextResponse.json({ message: buildSignInMessage(domain, parsed.data.address, nonce, issuedAt), token })
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  }
}
