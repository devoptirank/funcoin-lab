import { z } from "zod"
import { adminDb, adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { BUILT_IN_BLOCKED_TERMS, normalizeSafetyTerm } from "@/lib/safety"
import { parseSetting, settingsChanged } from "@/lib/settings"

/**
 * Add or remove an admin-added blocked term. Built-in terms are the floor: they can't be added
 * again or removed. The list is read fresh from the database (not the settings cache) so two quick
 * edits never overwrite each other.
 */

const schema = z.object({
  action: z.enum(["add", "remove"]),
  term: z.string().max(80),
  reason: z.string().trim().min(3, "Add a reason (at least 3 characters)").max(300),
})

const fail = (message: string) => Object.assign(new Error(message), { status: 400 })

export const POST = (req: Request) =>
  adminRoute(req, { permission: "safety.write", schema }, async (ctx, input) => {
    const term = normalizeSafetyTerm(input.term)
    if (!term) throw fail("Terms are 2 to 40 characters: lowercase letters, digits, spaces and hyphens.")

    const { data, error } = await adminDb().from("site_settings").select("value").eq("key", "safety").maybeSingle()
    if (error) throw Object.assign(new Error(error.message), { status: 500 })
    const stored = (data?.value as { extraTerms?: unknown } | null)?.extraTerms
    const current = Array.isArray(stored) ? stored.map((t) => (typeof t === "string" ? normalizeSafetyTerm(t) : null)).filter((t): t is string => Boolean(t)) : []

    let next: string[]
    if (input.action === "add") {
      if (BUILT_IN_BLOCKED_TERMS.includes(term)) throw fail(`"${term}" is already a built-in term.`)
      if (current.includes(term)) throw fail(`"${term}" is already on the list.`)
      next = [...current, term].sort()
    } else {
      if (BUILT_IN_BLOCKED_TERMS.includes(term)) throw fail("Built-in terms can't be removed.")
      if (!current.includes(term)) throw fail(`"${term}" isn't an admin-added term.`)
      next = current.filter((t) => t !== term)
    }

    const value = parseSetting("safety", { extraTerms: [...new Set(next)] })
    await adminRpc("admin_set_setting", { p_actor: actor(ctx), p_key: "safety", p_value: value, p_reason: `${input.action === "add" ? "Add" : "Remove"} "${term}": ${input.reason}` })
    settingsChanged()
    return { ok: true, extraTerms: value.extraTerms }
  })
