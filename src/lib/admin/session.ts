import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { PublicKey } from "@solana/web3.js"

/**
 * Step-up admin session. A normal 30-day wallet session is not enough for the admin panel: the
 * wallet also signs a separate admin message, and we set a short-lived, host-only cookie.
 *
 * - Signed with ADMIN_SESSION_SECRET, separate from SESSION_SECRET, so a normal session token or a
 *   normal sign-in nonce can never be turned into an admin one.
 * - No Domain attribute: the cookie stays on admin.funcoinlab.com and is never sent to the
 *   marketing or app hosts.
 */

export const ADMIN_COOKIE = "fcl_admin"
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60
const NONCE_SECONDS = 5 * 60

let devKey: Uint8Array | null = null
function adminKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim()
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret)
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET (32+ chars) is required in production")
  devKey ??= crypto.getRandomValues(new Uint8Array(32))
  return devKey
}

/** Cookie options. Exported so tests can assert there is no Domain attribute. */
export function adminCookieOptions(maxAge = ADMIN_SESSION_SECONDS) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge }
}

// ---------------- Admin sign-in message ----------------

/** Deliberately different from the normal sign-in message (first line, statement and expiry). */
export function buildAdminSignInMessage(domain: string, address: string, nonce: string, issuedAt: string, expiresAt: string) {
  return [
    `${domain} wants you to sign in to the FunCoin Lab admin panel with your Solana account:`,
    address,
    "",
    "FunCoin Lab admin sign-in. Only sign this on the FunCoin Lab admin site. It does not send a transaction or cost anything.",
    "",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiresAt}`,
  ].join("\n")
}

export async function issueAdminNonce(address: string, domain: string) {
  new PublicKey(address)
  const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(16)))
  const issuedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + NONCE_SECONDS * 1000).toISOString()
  const token = await new SignJWT({ nonce, addr: address, dom: domain, iat2: issuedAt, exp2: expiresAt, typ: "admin-nonce" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${NONCE_SECONDS}s`)
    .sign(adminKey())
  return { message: buildAdminSignInMessage(domain, address, nonce, issuedAt, expiresAt), token, nonce, expiresAt }
}

export async function verifyAdminSignIn(input: { domain: string; address: string; signature: string; token: string }) {
  const { payload } = await jwtVerify(input.token, adminKey(), { algorithms: ["HS256"] })
  if (payload.typ !== "admin-nonce" || payload.addr !== input.address || payload.dom !== input.domain) throw new Error("Admin sign-in request doesn't match")
  if (typeof payload.nonce !== "string" || typeof payload.iat2 !== "string" || typeof payload.exp2 !== "string") throw new Error("Malformed admin sign-in request")
  const message = buildAdminSignInMessage(input.domain, input.address, payload.nonce, payload.iat2, payload.exp2)
  const ok = nacl.sign.detached.verify(new TextEncoder().encode(message), bs58.decode(input.signature), new PublicKey(input.address).toBytes())
  if (!ok) throw new Error("Signature check failed")
  return { nonce: payload.nonce, expiresAt: payload.exp2 }
}

// ---------------- Cookie ----------------

export async function createAdminSession(accountId: string) {
  const token = await new SignJWT({ typ: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(accountId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_SECONDS}s`)
    .sign(adminKey())
  ;(await cookies()).set(ADMIN_COOKIE, token, adminCookieOptions())
}

/** The account the admin cookie was issued to, or null. */
export async function getAdminCookieAccount(): Promise<string | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, adminKey(), { algorithms: ["HS256"] })
    return payload.typ === "admin" && typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

export async function clearAdminSession() {
  ;(await cookies()).set(ADMIN_COOKIE, "", adminCookieOptions(0))
}
