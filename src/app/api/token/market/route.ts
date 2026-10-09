import { NextResponse } from "next/server"
import { TOKEN } from "@/lib/official"
import { getTokenMarket } from "@/lib/token-market"

/** Live market data for the official token. Public, read-only, cached ~30s on the server and CDN. */
export async function GET() {
  if (!TOKEN.live) return NextResponse.json({ error: "not_live" }, { status: 404 })
  const market = await getTokenMarket()
  if (!market) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json(market, { headers: { "Cache-Control": market.stale ? "no-store" : "public, s-maxage=30, stale-while-revalidate=60" } })
}
