import "server-only"
import { NextResponse } from "next/server"
import { getSession, type Session } from "@/lib/auth/session"
import { getBillingStore } from "./store"
import { walletPaymentsEnabled, solanaConfig } from "./solana"
import { nowPaymentsEnabled } from "./nowpayments"

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Connect and sign in with your wallet first." }, { status: 401 })
  return session
}

export function billingMethods() {
  return { wallet: walletPaymentsEnabled(), nowpayments: nowPaymentsEnabled(), cluster: solanaConfig().cluster }
}

export async function accountSnapshot(session: Session) {
  const store = getBillingStore()
  const [balance, ledger, orders] = await Promise.all([store.balance(session.accountId), store.ledger(session.accountId, 25), store.orders(session.accountId, 15)])
  return { signedIn: true, address: session.address, balance, ledger, orders, methods: billingMethods() }
}

export function siteOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "")
}
