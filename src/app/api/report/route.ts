import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { REPORT_REASONS, type ReportReasonId } from "@/lib/safety"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * Public content reports from the Report link on published sites. No sign-in needed; rate-limited
 * per IP. Only targets that exist and are publicly visible can be reported.
 */

const reasonIds = REPORT_REASONS.map((r) => r.id) as [ReportReasonId, ...ReportReasonId[]]

const schema = z.discriminatedUnion("targetType", [
  z.object({ targetType: z.literal("site"), slug: z.string().regex(/^[a-z0-9-]{2,64}$/), reason: z.enum(reasonIds), details: z.string().trim().max(500).optional().default("") }),
  z.object({ targetType: z.literal("asset"), id: z.uuid(), reason: z.enum(reasonIds), details: z.string().trim().max(500).optional().default("") }),
])

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "report"), 5, 600_000)
  if (!limit.ok) return json({ error: "You've sent several reports already. Try again in a few minutes." }, 429)

  const raw = await req.text()
  if (raw.length > 5_000) return json({ error: "Too large" }, 413)
  let input: unknown
  try {
    input = JSON.parse(raw)
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return json({ error: "Pick a reason and try again." }, 400)
  const data = parsed.data

  const sb = getSupabaseAdmin()
  if (!sb) return json({ error: "Reports aren't available right now." }, 503)

  let targetId: string
  if (data.targetType === "site") {
    const { data: project } = await sb.from("projects").select("id").eq("slug", data.slug).eq("published", true).eq("moderation_status", "ok").maybeSingle()
    if (!project) return json({ error: "That site isn't available." }, 404)
    targetId = project.id as string
  } else {
    const { data: asset } = await sb.from("generated_assets").select("id, account_id").eq("id", data.id).neq("moderation_status", "removed").maybeSingle()
    if (!asset) return json({ error: "That image isn't available." }, 404)
    // An image is public only when its owner has a live published site.
    const { count } = await sb
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("account_id", asset.account_id)
      .eq("published", true)
      .eq("moderation_status", "ok")
    if (!count) return json({ error: "That image isn't available." }, 404)
    targetId = asset.id as string
  }

  const label = REPORT_REASONS.find((r) => r.id === data.reason)?.label ?? data.reason
  const details = data.details.replace(/\s+/g, " ").trim()
  const session = await getSession().catch(() => null)
  const { error } = await sb.from("content_reports").insert({
    target_type: data.targetType,
    target_id: targetId,
    reason: details ? `${label}: ${details}`.slice(0, 600) : label,
    reporter_account: session?.accountId ?? null,
  })
  if (error) {
    console.error("[report] insert failed:", error.message)
    return json({ error: "Couldn't send the report. Please try again." }, 500)
  }
  return json({ ok: true })
}
