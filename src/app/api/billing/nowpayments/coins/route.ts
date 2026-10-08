import { NextResponse } from "next/server"
import { COIN_NAMES, enabledCoins, nowPaymentsEnabled } from "@/lib/billing/nowpayments"

/** Coins the customer can pick in checkout (enabled on the NOWPayments account). */
export async function GET() {
  if (!nowPaymentsEnabled()) return NextResponse.json({ coins: [] })
  const coins = await enabledCoins()
  return NextResponse.json({ coins: coins.map((code) => ({ code, name: COIN_NAMES[code] ?? code.toUpperCase() })) })
}
