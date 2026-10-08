import "server-only"
import { NextResponse } from "next/server"
import type { z } from "zod"
import { requestHost } from "@/lib/hosts"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireAdminApi, type AdminContext } from "./guard"
import type { Permission } from "./permissions"
import { verifyStepUp, type StepUpRequest } from "./stepup"

/**
 * Shared plumbing for /api/admin/* mutation routes:
 * guard (host, session, role, permission, Origin, rate limit) -> Zod body -> optional step-up -> run.
 *
 * When `stepUp(input)` returns a request, the action needs a fresh wallet signature. The first call
 * gets 428 { code: "stepup_required", stepUp }, the client signs (see AdminAction) and retries with
 * { stepUp: { signature, token } }.
 */
export async function adminRoute<S extends z.ZodType>(
  req: Request,
  opts: { permission: Permission; schema: S; stepUp?: (input: z.infer<S>, ctx: AdminContext) => StepUpRequest | null },
  run: (ctx: AdminContext, input: z.infer<S>, signature: string | null) => Promise<unknown>,
) {
  const ctx = await requireAdminApi(req, opts.permission)
  if (ctx instanceof NextResponse) return ctx
  const raw = (await req.json().catch(() => null)) as (Record<string, unknown> & { stepUp?: { signature?: string; token?: string } }) | null
  if (!raw || typeof raw !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  const { stepUp: proof, ...rest } = raw
  const parsed = opts.schema.safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: `Invalid request: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}` }, { status: 400 })
  try {
    let signature: string | null = null
    const need = opts.stepUp?.(parsed.data, ctx) ?? null
    if (need) {
      if (!proof?.signature || !proof?.token) return NextResponse.json({ error: "This action needs a wallet signature.", code: "stepup_required", stepUp: need }, { status: 428 })
      signature = await verifyStepUp(ctx, need, requestHost(req), { signature: proof.signature, token: proof.token })
    }
    const result = await run(ctx, parsed.data, signature)
    return result instanceof Response ? result : NextResponse.json(result ?? { ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400
    const message = error instanceof Error ? error.message : "Request failed"
    if (status >= 500) console.error("[admin]", error)
    return NextResponse.json({ error: message }, { status })
  }
}

/** Call an admin SQL function; database errors become readable 400s. */
export async function adminRpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const sb = getSupabaseAdmin()
  if (!sb) throw Object.assign(new Error("Supabase isn't connected"), { status: 503 })
  const { data, error } = await sb.rpc(fn, args)
  if (error) throw Object.assign(new Error(error.message), { status: 400 })
  return data as T
}

/** The service-role client for admin reads, or a 503-style error. */
export function adminDb() {
  const sb = getSupabaseAdmin()
  if (!sb) throw Object.assign(new Error("Supabase isn't connected"), { status: 503 })
  return sb
}

/** CSV download (RFC 4180 quoting). Callers cap the rows and write an audit event. */
export function csvResponse(filename: string, header: string[], rows: unknown[][]) {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)
    // Neutralize spreadsheet formulas.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const body = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n")
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } })
}

/** limit/offset pagination from searchParams. */
export function pageOf(sp: Record<string, string | string[] | undefined>, size = 25) {
  const page = Math.max(1, Math.min(10_000, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1))
  return { page, size, from: (page - 1) * size, to: page * size - 1 }
}

export const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ""
