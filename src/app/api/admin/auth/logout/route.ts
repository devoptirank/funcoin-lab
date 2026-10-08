import { NextResponse } from "next/server"
import { clearAdminSession } from "@/lib/admin/session"

/** Leave the admin panel. The normal wallet session is kept. */
export async function POST() {
  await clearAdminSession()
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
