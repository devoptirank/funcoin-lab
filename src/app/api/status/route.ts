import { NextResponse } from "next/server"
import { aiStatus } from "@/lib/ai"
import { getDomainProvider } from "@/lib/domains"

// Exposes provider *names* only — never keys.
export async function GET() {
  return NextResponse.json({ ai: aiStatus(), domains: getDomainProvider().id })
}
