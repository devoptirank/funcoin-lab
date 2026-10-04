import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { accountSnapshot, billingMethods } from "@/lib/billing/server"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ signedIn: false, methods: billingMethods() })
  return NextResponse.json(await accountSnapshot(session))
}
