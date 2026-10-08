import { NextResponse } from "next/server"
import { announcementActive, getSetting } from "@/lib/settings"
import { getSocials } from "@/lib/official"
import type { PublicSettings } from "@/lib/public-settings"

/**
 * Runtime settings the browser may see: pricing, feature switches, the announcement (only while it
 * is active) and social links. Never secrets, limits, maintenance details or safety terms. The
 * underlying reads are cached under the "settings" tag; the CDN keeps the response briefly.
 */
export async function GET() {
  const [pricing, features, announcement, socials] = await Promise.all([getSetting("pricing"), getSetting("features"), getSetting("announcement"), getSocials()])
  const body: PublicSettings = {
    pricing: { packs: pricing.packs, imageCosts: pricing.imageCosts, welcomeCredits: pricing.welcomeCredits },
    features,
    announcement: announcementActive(announcement) ? announcement : null,
    socials,
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } })
}
