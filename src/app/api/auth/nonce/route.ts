import { requestHost } from "@/lib/hosts"
import { NextResponse } from "next/server"
import { z } from "zod"
import { PublicKey } from "@solana/web3.js"
import { buildSignInMessage, issueNonce } from "@/lib/auth/siws"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { billingUnavailable } from "@/lib/billing/server"

const schema = z.object({ address: z.string().min(32).max(44) })

export async function POST(req: Request) {
  const offline = billingUnavailable()
  if (offline) return offline
  if (!rateLimit(clientKey(req, "auth-nonce"), 20, 60_000).ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  try {
    new PublicKey(parsed.data.address)
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  }
  try {
    const { nonce, issuedAt, token } = await issueNonce(parsed.data.address)
    const domain = requestHost(req)
    return NextResponse.json({ message: buildSignInMessage(domain, parsed.data.address, nonce, issuedAt), token })
  } catch (error) {
    // The address is valid, so this is a server problem (for example a missing SESSION_SECRET).
    console.error("[auth] nonce failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Wallet sign-in isn't available right now. Please try again later." }, { status: 503 })
  }
}
