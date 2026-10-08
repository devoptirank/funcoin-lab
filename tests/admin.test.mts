/**
 * Admin security unit tests: npm run test:admin
 * (node --test with the react-server condition, so "server-only" modules load outside Next.)
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { ADMIN_ROLES, PERMISSIONS, can, type Permission } from "../src/lib/admin/permissions"
import { adminCookieOptions, buildAdminSignInMessage, issueAdminNonce, verifyAdminSignIn } from "../src/lib/admin/session"
import { buildSignInMessage } from "../src/lib/auth/siws"

const MUTATIONS = (Object.keys(PERMISSIONS) as Permission[]).filter((p) => !p.endsWith(".read") && p !== "admin.view")

test("viewer can read but never mutate", () => {
  assert.ok(can("viewer", "users.read"))
  for (const p of MUTATIONS) assert.equal(can("viewer", p), false, `viewer must not have ${p}`)
})

test("support: capped credit grants, no large adjustments, no admin management", () => {
  assert.ok(can("support", "credits.adjust"))
  assert.equal(can("support", "credits.adjust.large"), false)
  assert.equal(can("support", "settings.write"), false)
  assert.equal(can("support", "admins.manage"), false)
  assert.ok(can("support", "sites.unpublish"))
})

test("only owners manage admins", () => {
  for (const r of ADMIN_ROLES) assert.equal(can(r, "admins.manage"), r === "owner")
})

test("no role means no permission", () => {
  for (const p of Object.keys(PERMISSIONS) as Permission[]) assert.equal(can(null, p), false)
})

test("admin cookie is host-only, HttpOnly, SameSite=Strict, 8 hours", () => {
  const o = adminCookieOptions()
  assert.equal("domain" in o, false, "must not set a Domain attribute")
  assert.equal(o.httpOnly, true)
  assert.equal(o.sameSite, "strict")
  assert.equal(o.path, "/")
  assert.equal(o.maxAge, 8 * 60 * 60)
})

test("admin sign-in message differs from the normal sign-in message", () => {
  const a = buildAdminSignInMessage("admin.funcoinlab.com", "Addr", "n1", "t1", "t2")
  const n = buildSignInMessage("admin.funcoinlab.com", "Addr", "n1", "t1")
  assert.notEqual(a, n)
  assert.match(a, /FunCoin Lab admin sign-in/)
  assert.doesNotMatch(n, /admin sign-in/i)
})

test("a normal sign-in signature can't be used for admin sign-in", async () => {
  const kp = nacl.sign.keyPair()
  const address = bs58.encode(kp.publicKey)
  const domain = "admin.funcoinlab.com"
  const { token, nonce } = await issueAdminNonce(address, domain)
  // The wallet signs the ordinary sign-in message (same nonce) instead of the admin one.
  const normal = buildSignInMessage(domain, address, nonce, new Date().toISOString())
  const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(normal), kp.secretKey))
  await assert.rejects(verifyAdminSignIn({ domain, address, signature, token }))
})

test("admin nonce is bound to its domain and wallet", async () => {
  const kp = nacl.sign.keyPair()
  const address = bs58.encode(kp.publicKey)
  const { token, message } = await issueAdminNonce(address, "admin.funcoinlab.com")
  const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey))
  await verifyAdminSignIn({ domain: "admin.funcoinlab.com", address, signature, token })
  await assert.rejects(verifyAdminSignIn({ domain: "funcoinlab.com", address, signature, token }))
  const other = bs58.encode(nacl.sign.keyPair().publicKey)
  await assert.rejects(verifyAdminSignIn({ domain: "admin.funcoinlab.com", address: other, signature, token }))
})
