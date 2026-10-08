import "server-only"
import { NextResponse } from "next/server"
import type { z } from "zod"
import { clientKey, rateLimit } from "./rate-limit"
import { getSession } from "./auth/session"

/** Shared plumbing for JSON route handlers: wallet session → rate limit → parse → validate → run. */
export async function handleJson<S extends z.ZodType, R>(
  req: Request,
  opts: { scope: string; schema: S; limit?: number },
  run: (input: z.infer<S>) => Promise<R>,
) {
  if (!(await getSession())) return NextResponse.json({ error: "Connect your wallet to use the lab.", code: "auth" }, { status: 401 })
  const rl = rateLimit(clientKey(req, opts.scope), opts.limit ?? 20)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Whoa, meme overload. Take a breath and try again in a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = opts.schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues.slice(0, 5) }, { status: 400 })
  }
  try {
    const result = await run(parsed.data)
    return result instanceof Response ? result : NextResponse.json(result)
  } catch (error) {
    console.error(`[api:${opts.scope}]`, error)
    return NextResponse.json({ error: "Something went sideways. Please try again." }, { status: 500 })
  }
}
