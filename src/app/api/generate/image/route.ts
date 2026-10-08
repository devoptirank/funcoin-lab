import { NextResponse } from "next/server"
import { z } from "zod"
import { brandRefSchema } from "@/lib/ai/schemas"
import { getImageProvider } from "@/lib/ai"
import { IMAGE_ASSET_TYPES, IMAGE_SIZE, MASCOT_POSES, buildImagePrompt } from "@/lib/ai/image-prompts"
import { checkTopic, sanitizeText } from "@/lib/safety"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { getSession } from "@/lib/auth/session"
import { getBillingStore } from "@/lib/billing/store"
import { billingUnavailable } from "@/lib/billing/server"
import { IMAGE_COSTS } from "@/lib/billing/plans"
import { saveAsset } from "@/lib/data/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const maxDuration = 150

const DAY = 24 * 60 * 60 * 1000
const GLOBAL_DAILY = Number(process.env.IMAGE_GLOBAL_DAILY_LIMIT ?? 300)
// High by default: credit prices cover it, and these are the images people post. IMAGE_QUALITY overrides.
const QUALITY = (["low", "medium", "high", "auto"] as const).find((q) => q === process.env.IMAGE_QUALITY) ?? "high"

const schema = z.object({
  conceptId: z.string().regex(/^[A-Za-z0-9_-]{4,64}$/),
  type: z.enum(IMAGE_ASSET_TYPES),
  brand: brandRefSchema.extend({ palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(6).optional() }),
  pose: z.enum(MASCOT_POSES).optional(),
  scene: z.string().trim().max(200).optional(),
})

export async function POST(req: Request) {
  const provider = getImageProvider()
  if (!provider?.generateImage || !getSupabaseAdmin()) {
    return NextResponse.json({ error: "AI image generation isn't configured on this deployment." }, { status: 503 })
  }

  let input: z.infer<typeof schema>
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    input = parsed.data
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // AI images are paid with credits, so they need a signed-in wallet.
  const offline = billingUnavailable()
  if (offline) return offline
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Connect your wallet to generate AI images.", code: "auth" }, { status: 401 })

  // Abuse guards on top of credits: a short burst limit and a site-wide daily cap.
  const burst = rateLimit(clientKey(req, "image-burst"), 4, 60_000)
  if (!burst.ok) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429, headers: { "Retry-After": String(burst.retryAfter) } })
  }
  if (!rateLimit("image-global", GLOBAL_DAILY, DAY).ok) {
    return NextResponse.json({ error: "The lab's image budget for today is used up. Try again tomorrow." }, { status: 429 })
  }

  // Everything the user can influence gets checked before we spend anything.
  const userText = [input.brand.name, input.brand.tagline, input.brand.catchphrase, input.brand.slogan, input.scene].filter(Boolean).join("\n")
  if (!checkTopic(userText).ok) return NextResponse.json({ error: "Let's keep it fun. Try a different idea." }, { status: 422 })
  try {
    if (provider.moderate && (await provider.moderate(userText))) {
      return NextResponse.json({ error: "That idea didn't pass our content check. Try something else." }, { status: 422 })
    }
  } catch (error) {
    console.error("[image] moderation failed, refusing to generate:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Content check is unavailable right now. Please try again." }, { status: 503 })
  }

  // Charge first; refund if anything below fails.
  const store = getBillingStore()
  const cost = IMAGE_COSTS[input.type]
  const chargeRef = `image:${crypto.randomUUID()}`
  const charge = await store.spend(session.accountId, cost, `AI ${input.type.replace("-", " ")}`, chargeRef)
  if (!charge.ok) {
    return NextResponse.json({ error: `This image costs ${cost} credits. You have ${charge.balance}.`, code: "credits", cost, balance: charge.balance }, { status: 402 })
  }
  const refund = () => store.credit(session.accountId, cost, "Refund: image failed", `refund:${chargeRef}`)

  const prompt = sanitizeText(
    buildImagePrompt(input.type, { ...input.brand, palette: input.brand.palette }, { pose: input.pose, scene: input.scene }),
  )
  try {
    const image = await provider.generateImage(prompt, { size: IMAGE_SIZE[input.type], quality: QUALITY })
    if (!image?.b64) throw new Error("No image returned")
    const asset = await saveAsset(session.accountId, {
      conceptId: input.conceptId,
      type: input.type,
      pose: input.pose ?? null,
      bytes: Buffer.from(image.b64, "base64"),
      mime: image.mimeType ?? "image/webp",
      prompt,
      model: process.env.IMAGE_MODEL || "gpt-image-2",
    })
    return NextResponse.json({ asset, cost, balance: charge.balance })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[image] generation failed:", message)
    await refund().catch((e) => console.error("[image] REFUND FAILED for", chargeRef, e))
    const blocked = /content filter/i.test(message)
    return NextResponse.json({ error: blocked ? "That image was blocked by the content filter. Try a different idea." : "Image generation failed. Please try again." }, { status: blocked ? 422 : 502 })
  }
}
