import "server-only"
import { NextResponse } from "next/server"
import { getSession, type Session } from "@/lib/auth/session"
import { billingAvailable, getBillingStore } from "./store"
import { walletPaymentsEnabled, solanaConfig } from "./solana"
import { nowPaymentsEnabled } from "./nowpayments"

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Connect and sign in with your wallet first." }, { status: 401 })
  return session
}

export function billingMethods() {
  const ready = billingAvailable()
  return { ready, wallet: ready && walletPaymentsEnabled(), nowpayments: ready && nowPaymentsEnabled(), cluster: solanaConfig().cluster }
}

/** 503 response when the credit ledger can't run on this host, otherwise null. */
export function billingUnavailable(): NextResponse | null {
  if (billingAvailable()) return null
  return NextResponse.json({ error: "Wallet sign-in is being switched on. Please try again in a few minutes." }, { status: 503 })
}

export async function accountSnapshot(session: Session) {
  const store = getBillingStore()
  const [balance, ledger, orders] = await Promise.all([store.balance(session.accountId), store.ledger(session.accountId, 25), store.orders(session.accountId, 15)])
  return { signedIn: true, address: session.address, balance, ledger, orders, methods: billingMethods() }
}

export function siteOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "")
}

/** Where buyers return after checkout: the app host when it's configured. */
export function appOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || siteOrigin(req)).replace(/\/$/, "")
}
