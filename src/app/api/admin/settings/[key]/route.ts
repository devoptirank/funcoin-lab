import { NextResponse } from "next/server"
import { z } from "zod"
import { adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import type { StepUpRequest } from "@/lib/admin/stepup"
import { getSetting, parseSetting, settingsChanged, type SettingKey, type SettingValue } from "@/lib/settings"
import { sanitizeText } from "@/lib/safety"

/**
 * Save one runtime setting from the admin Settings page. The value is validated by the setting's
 * Zod schema, written with admin_set_setting (which audits it in the same transaction), and the
 * settings cache is revalidated so every instance picks it up on its next request.
 *
 * Step-up (fresh wallet signature) is required for: pricing, turning maintenance mode on, turning
 * off sign-ins or any checkout method, and raising the support credit cap.
 * The "safety" key is edited from the Safety page, not here.
 */

const EDITABLE = ["pricing", "features", "limits", "maintenance", "announcement", "socials"] as const satisfies readonly SettingKey[]
type EditableKey = (typeof EDITABLE)[number]

const schema = z.object({ value: z.unknown(), reason: z.string().trim().min(3, "add a reason (at least 3 characters)").max(300) })

const CHECKOUTS = [
  ["checkoutSol", "SOL checkout"],
  ["checkoutUsdc", "USDC checkout"],
  ["checkoutNowpayments", "NOWPayments checkout"],
] as const

function stepUpFor(key: EditableKey, value: unknown, current: unknown): StepUpRequest | null {
  if (key === "pricing") {
    const v = value as SettingValue<"pricing">
    const packs = v.packs.map((p) => `${p.name} ${p.credits} credits $${p.usd}`).join("; ")
    return { action: "setting.pricing", summary: `Change pricing. Packs: ${packs}. Welcome credits: ${v.welcomeCredits}.`.slice(0, 400), params: { key, value: v } }
  }
  if (key === "maintenance") {
    const v = value as SettingValue<"maintenance">
    const was = current as SettingValue<"maintenance">
    if (v.enabled && !was.enabled) return { action: "setting.maintenance.on", summary: "Turn ON maintenance mode. The app will be unavailable to everyone except admins.", params: { key, value: v } }
    return null
  }
  if (key === "features") {
    const v = value as SettingValue<"features">
    const was = current as SettingValue<"features">
    const off: string[] = []
    if (was.signIns && !v.signIns) off.push("new sign-ins")
    for (const [k, label] of CHECKOUTS) if (was[k] && !v[k]) off.push(label)
    if (!off.length) return null
    return { action: "setting.features.off", summary: `Turn OFF: ${off.join(", ")}.`, params: { key, value: v } }
  }
  if (key === "limits") {
    const v = value as SettingValue<"limits">
    const was = current as SettingValue<"limits">
    if (v.supportCreditCap > was.supportCreditCap) {
      return { action: "setting.limits.supportcap", summary: `Raise the support credit cap from ${was.supportCreditCap} to ${v.supportCreditCap} credits per action.`, params: { key, value: v } }
    }
  }
  return null
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key: rawKey } = await params
  if (!(EDITABLE as readonly string[]).includes(rawKey)) return NextResponse.json({ error: "Unknown setting" }, { status: 404, headers: { "Cache-Control": "no-store" } })
  const key = rawKey as EditableKey
  // The value being replaced, so step-up only triggers on the dangerous direction of a change.
  const current = await getSetting(key)

  const clean = (value: unknown) => {
    const parsed = parseSetting(key, value)
    const bad = (message: string) => Object.assign(new Error(message), { status: 400 })
    if (key === "pricing") {
      const ids = (parsed as SettingValue<"pricing">).packs.map((p) => p.id)
      if (new Set(ids).size !== ids.length) throw bad("Each pack needs a unique id")
    }
    if (key === "announcement") {
      const a = parsed as SettingValue<"announcement">
      if (a.start && a.end && Date.parse(a.end) <= Date.parse(a.start)) throw bad("The end time must be after the start time")
      return { ...a, text: sanitizeText(a.text) }
    }
    return parsed
  }

  return adminRoute(
    req,
    { permission: "settings.write", schema, stepUp: (input) => stepUpFor(key, clean(input.value), current) },
    async (ctx, input, signature) => {
      const value = clean(input.value)
      await adminRpc("admin_set_setting", { p_actor: actor(ctx, signature ?? undefined), p_key: key, p_value: value, p_reason: input.reason })
      settingsChanged()
      return { ok: true, key, value }
    },
  )
}
