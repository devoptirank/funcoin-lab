import { z } from "zod"
import { adminRoute } from "@/lib/admin/api"
import { matchBlockedTerm, sanitizeText } from "@/lib/safety"
import { getSetting } from "@/lib/settings"

/** Dry run of the safety filter on a phrase: the rewritten text and the topic check result. Changes nothing. */
export const POST = (req: Request) =>
  adminRoute(req, { permission: "content.read", schema: z.object({ text: z.string().min(1).max(2000) }) }, async (_ctx, input) => {
    const { extraTerms } = await getSetting("safety")
    const hit = matchBlockedTerm(input.text, extraTerms)
    return { sanitized: sanitizeText(input.text), topicOk: !hit, blockedBy: hit }
  })
