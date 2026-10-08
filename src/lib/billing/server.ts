import "server-only"
import { NextResponse } from "next/server"
import { getSession, type Session } from "@/lib/auth/session"
import { blockedAccountResponse } from "@/lib/admin/account-status"
import { billingAvailable, getBillingStore } from "./store"
import { walletPaymentsEnabled, solanaConfig } from "./solana"
import { nowPaymentsEnabled } from "./nowpayments"
import { getSetting, type Features } from "@/lib/settings"

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Connect and sign in with your wallet first." }, { status: 401 })
  return (await blockedAccountResponse(session.accountId)) ?? session
}

type CheckoutFlags = Pick<Features, "checkoutSol" | "checkoutUsdc" | "checkoutNowpayments">
const ALL_ON: CheckoutFlags = { checkoutSol: true, checkoutUsdc: true, checkoutNowpayments: true }

/**
 * Which payment methods can be used: configured on this deployment AND switched on in admin
 * Settings. `wallet` covers SOL and USDC (on when either is); `sol`/`usdc` say which.
 */
export function billingMethods(flags: CheckoutFlags = ALL_ON) {
  const ready = billingAvailable()
  const walletReady = ready && walletPaymentsEnabled()
  const sol = walletReady && flags.checkoutSol
  const usdc = walletReady && flags.checkoutUsdc
  return { ready, wallet: sol || usdc, sol, usdc, nowpayments: ready && nowPaymentsEnabled() && flags.checkoutNowpayments, cluster: solanaConfig().cluster }
}

/** billingMethods() with the current checkout switches from admin Settings applied. */
export async function liveBillingMethods() {
  try {
    return billingMethods(await getSetting("features"))
  } catch {
    return billingMethods()
  }
}

/** 503 response when the credit ledger can't run on this host, otherwise null. */
export function billingUnavailable(): NextResponse | null {
  if (billingAvailable()) return null
  return NextResponse.json({ error: "Wallet sign-in is being switched on. Please try again in a few minutes." }, { status: 503 })
}

export async function accountSnapshot(session: Session) {
  const store = getBillingStore()
  const [balance, ledger, orders, methods] = await Promise.all([store.balance(session.accountId), store.ledger(session.accountId, 25), store.orders(session.accountId, 15), liveBillingMethods()])
  return { signedIn: true, address: session.address, balance, ledger, orders, methods }
}

export function siteOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "")
}

/** Where buyers return after checkout: the app host when it's configured. */
export function appOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || siteOrigin(req)).replace(/\/$/, "")
}
