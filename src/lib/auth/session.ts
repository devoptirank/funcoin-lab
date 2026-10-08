import "server-only"
import { cookies, headers } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { sharedCookieDomain } from "@/lib/hosts"

/**
 * Wallet sessions. After a wallet signs our sign-in message we set an HttpOnly cookie holding a
 * signed JWT. The account id is "sol:<base58 address>".
 */
const COOKIE = "fcl_session"
const MAX_AGE = 60 * 60 * 24 * 30

let devSecret: Uint8Array | null = null
export function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim()
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret)
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (32+ chars) is required in production")
  // Dev only: a per-process secret. Sessions reset when the dev server restarts.
  devSecret ??= crypto.getRandomValues(new Uint8Array(32))
  return devSecret
}

export type Session = { accountId: string; address: string }

export async function createSession(address: string) {
  const token = await new SignJWT({ addr: address })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`sol:${address}`)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(sessionKey())
  const jar = await cookies()
  // Shared with app.<domain> so connecting on the marketing site signs you in to the app too.
  const domain = sharedCookieDomain((await headers()).get("host"))
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE, domain })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] })
    if (typeof payload.sub !== "string" || typeof payload.addr !== "string") return null
    return { accountId: payload.sub, address: payload.addr }
  } catch {
    return null
  }
}

export async function clearSession() {
  const jar = await cookies()
  const domain = sharedCookieDomain((await headers()).get("host"))
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0, domain })
}
