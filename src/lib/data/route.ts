import "server-only"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession, type Session } from "@/lib/auth/session"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { DataUnavailableError } from "./server"
import { blockedAccountResponse } from "@/lib/admin/account-status"

/** Runs a /api/me handler for the signed-in wallet: auth, rate limit and error mapping. */
export async function withAccount(req: Request, run: (session: Session) => Promise<unknown>) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Connect your wallet first.", code: "auth" }, { status: 401 })
  const blocked = await blockedAccountResponse(session.accountId)
  if (blocked) return blocked
  if (!rateLimit(clientKey(req, `me:${session.accountId}`), 120, 60_000).ok) {
    return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 })
  }
  try {
    const result = await run(session)
    return result instanceof Response ? result : NextResponse.json(result ?? { ok: true })
  } catch (error) {
    if (error instanceof DataUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 })
    const status = (error as { status?: number }).status
    if (status === 404) return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error("[api:me]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

/** Parse a JSON body against a schema, or return a 400 response. */
export async function body<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S> | Response> {
  const raw = await req.text()
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Too large" }, { status: 413 })
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(json)
  return parsed.success ? parsed.data : NextResponse.json({ error: "Invalid request" }, { status: 400 })
}

export const projectIdSchema = z.string().regex(/^[A-Za-z0-9_-]{4,64}$/)
