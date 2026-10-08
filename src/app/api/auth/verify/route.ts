import { requestHost } from "@/lib/hosts"
import { NextResponse } from "next/server"
import { z } from "zod"
import { verifySignIn } from "@/lib/auth/siws"
import { createSession } from "@/lib/auth/session"
import { getBillingStore } from "@/lib/billing/store"
import { accountSnapshot, billingUnavailable } from "@/lib/billing/server"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { getSetting, unavailable } from "@/lib/settings"
import { getAdminRole } from "@/lib/admin/guard"

const schema = z.object({ address: z.string().min(32).max(44), signature: z.string().min(40).max(120), token: z.string().min(20).max(2000) })

export async function POST(req: Request) {
  const offline = billingUnavailable()
  if (offline) return offline
  if (!rateLimit(clientKey(req, "auth-verify"), 20, 60_000).ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid sign-in request" }, { status: 400 })
  const { address, signature, token } = parsed.data
  // Admin Settings can pause new sign-ins (admins can still sign in). Defaults keep them on.
  const [features, pricing] = await Promise.all([getSetting("features"), getSetting("pricing")])
  if (!features.signIns && !(await getAdminRole(`sol:${address}`).catch(() => null))) return unavailable("Wallet sign-in")
  try {
    const { nonce, expiresAt } = await verifySignIn({ domain: requestHost(req), address, signature, token })
    const store = getBillingStore()
    if (!(await store.consumeNonce(nonce, expiresAt))) return NextResponse.json({ error: "This sign-in request was already used" }, { status: 400 })
    await createSession(address)
    await store.ensureAccount(`sol:${address}`, address, pricing.welcomeCredits)
    return NextResponse.json(await accountSnapshot({ accountId: `sol:${address}`, address }))
  } catch (error) {
    console.error("[auth] wallet sign-in failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Wallet sign-in failed. Please try again." }, { status: 401 })
  }
}
