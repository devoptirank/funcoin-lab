import { NextResponse, type NextRequest } from "next/server"
import { TOKEN } from "@/lib/official"
import { CHART_RANGES, getTokenChart, isChartRange } from "@/lib/token-market"

/** Real price history for the official token's verified pair: ?range=1h|24h|7d|30d. */
export async function GET(request: NextRequest) {
  if (!TOKEN.live) return NextResponse.json({ error: "not_live" }, { status: 404 })
  const range = request.nextUrl.searchParams.get("range") ?? "24h"
  if (!isChartRange(range)) return NextResponse.json({ error: "bad_range" }, { status: 400 })
  try {
    const chart = await getTokenChart(range)
    if (!chart) return NextResponse.json({ error: "no_pair" }, { status: 503, headers: { "Cache-Control": "no-store" } })
    const ttl = CHART_RANGES[range].revalidate
    return NextResponse.json({ range, ...chart }, { headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}` } })
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
