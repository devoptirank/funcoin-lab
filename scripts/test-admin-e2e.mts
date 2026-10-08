/**
 * Admin panel end-to-end security checks against a running server.
 *
 * Start a production build with split hosts and a throwaway owner wallet, for example:
 *   NEXT_PUBLIC_SITE_URL=http://lab.test:3100 NEXT_PUBLIC_APP_URL=http://app.lab.test:3100 \
 *   ADMIN_URL=http://admin.lab.test:3100 ADMIN_WALLETS=<owner address> npx next start -p 3100
 * then:
 *   E2E_OWNER_SECRET=<owner secret key, base58> npm run test:admin:e2e
 * With E2E_PHASE=removed (and the server restarted WITHOUT that wallet in ADMIN_WALLETS) it checks
 * that the saved admin cookies stop working immediately.
 *
 * Host headers are sent with node:http, because fetch() can't override Host.
 */
import http from "node:http"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import nacl from "tweetnacl"
import bs58 from "bs58"

const PORT = Number(process.env.E2E_PORT ?? 3100)
const SITE = `lab.test:${PORT}`
const APP = `app.lab.test:${PORT}`
const ADMIN = `admin.lab.test:${PORT}`
const JAR_FILE = process.env.E2E_JAR ?? "/tmp/fcl-admin-e2e.json"

type Res = { status: number; headers: http.IncomingHttpHeaders; body: string }
function request(method: string, path: string, host: string, opts: { body?: unknown; cookie?: string; origin?: string } = {}): Promise<Res> {
  return new Promise((resolve, reject) => {
    const data = opts.body === undefined ? undefined : JSON.stringify(opts.body)
    const r = http.request(
      { host: "127.0.0.1", port: PORT, method, path, headers: { host, ...(data ? { "content-type": "application/json" } : {}), ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.origin ? { origin: opts.origin } : {}) } },
      (res) => {
        let body = ""
        res.on("data", (c) => (body += c))
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }))
      },
    )
    r.on("error", reject)
    if (data) r.write(data)
    r.end()
  })
}
const cookiesFrom = (res: Res) => (res.headers["set-cookie"] ?? []).map((c) => c.split(";")[0]).filter((c) => !c.endsWith("="))

let failed = 0
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`)
}

async function walletSession(kp: nacl.SignKeyPair, host: string): Promise<string> {
  const address = bs58.encode(kp.publicKey)
  const n = await request("POST", "/api/auth/nonce", host, { body: { address } })
  const { message, token } = JSON.parse(n.body)
  const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey))
  const v = await request("POST", "/api/auth/verify", host, { body: { address, signature, token } })
  return cookiesFrom(v).join("; ")
}

if (process.env.E2E_PHASE === "removed") {
  const jar = existsSync(JAR_FILE) ? (JSON.parse(readFileSync(JAR_FILE, "utf8")) as { cookie: string }) : null
  if (!jar) throw new Error("Run the main phase first")
  const page = await request("GET", "/", ADMIN, { cookie: jar.cookie })
  check("removed admin is locked out immediately (page)", page.status === 404 && !/Sign out of admin/.test(page.body), `status ${page.status}`)
  const nonce = await request("POST", "/api/admin/auth/nonce", ADMIN, { cookie: jar.cookie })
  check("removed admin is locked out immediately (API)", nonce.status === 404, `status ${nonce.status}`)
  process.exit(failed ? 1 : 0)
}

// 1. The panel doesn't exist on the public hosts.
for (const [name, host] of [["marketing", SITE], ["app", APP]] as const) {
  const p = await request("GET", "/admin", host)
  check(`/admin is a plain 404 on the ${name} host`, p.status === 404 && !p.headers.location, `status ${p.status}`)
  const a = await request("POST", "/api/admin/auth/nonce", host)
  check(`/api/admin is a 404 on the ${name} host`, a.status === 404, `status ${a.status}`)
}

// 2. Admin host: anonymous visitors, headers, and nothing but admin routes.
const anon = await request("GET", "/", ADMIN)
check("admin host shows only a wallet connect screen to anonymous visitors", /Connect your wallet to continue/.test(anon.body) && !/Sign out of admin/.test(anon.body))
check("admin host sends noindex", /noindex/.test(String(anon.headers["x-robots-tag"])))
check("admin host forbids framing", String(anon.headers["x-frame-options"]) === "DENY" && /frame-ancestors 'none'/.test(String(anon.headers["content-security-policy"])))
check("admin host sends no-referrer and no-store", anon.headers["referrer-policy"] === "no-referrer" && /no-store/.test(String(anon.headers["cache-control"])))
check("admin host doesn't serve app APIs", (await request("GET", "/api/me/projects", ADMIN)).status === 404)
check("admin host doesn't serve marketing pages under /admin", (await request("GET", "/admin", ADMIN)).status === 404)
const robots = await request("GET", "/robots.txt", ADMIN)
check("admin host robots.txt disallows everything", /Disallow: \/\s*$/m.test(robots.body))

// 3. A signed-in wallet that isn't an admin gets a 404 everywhere.
const stranger = await walletSession(nacl.sign.keyPair(), ADMIN)
const sp = await request("GET", "/", ADMIN, { cookie: stranger })
check("non-admin wallet: admin page is a 404", sp.status === 404 && !/Admin sign-in|Sign out of admin/.test(sp.body), `status ${sp.status}`)
check("non-admin wallet: admin nonce API is a 404", (await request("POST", "/api/admin/auth/nonce", ADMIN, { cookie: stranger })).status === 404)

// 4. The owner needs the step-up signature before seeing the panel.
const secret = process.env.E2E_OWNER_SECRET
if (!secret) throw new Error("Set E2E_OWNER_SECRET (base58 secret key of an ADMIN_WALLETS owner)")
const owner = nacl.sign.keyPair.fromSecretKey(bs58.decode(secret))
const ownerAddress = bs58.encode(owner.publicKey)
const session = await walletSession(owner, ADMIN)
const before = await request("GET", "/", ADMIN, { cookie: session })
check("owner without admin cookie sees the step-up screen", /Admin sign-in/.test(before.body) && !/Sign out of admin/.test(before.body))

const n = JSON.parse((await request("POST", "/api/admin/auth/nonce", ADMIN, { cookie: session })).body) as { message: string; token: string }
check("admin message is the admin statement", /FunCoin Lab admin sign-in/.test(n.message))
// A normal sign-in signature (same wallet) must not be accepted as an admin one.
const normalMsg = JSON.parse((await request("POST", "/api/auth/nonce", ADMIN, { body: { address: ownerAddress } })).body).message as string
const replay = await request("POST", "/api/admin/auth/verify", ADMIN, {
  cookie: session,
  body: { token: n.token, signature: bs58.encode(nacl.sign.detached(new TextEncoder().encode(normalMsg), owner.secretKey)) },
})
check("normal sign-in signature is rejected for admin sign-in", replay.status === 401, `status ${replay.status}`)

const v = await request("POST", "/api/admin/auth/verify", ADMIN, { cookie: session, body: { token: n.token, signature: bs58.encode(nacl.sign.detached(new TextEncoder().encode(n.message), owner.secretKey)) } })
const setCookie = (v.headers["set-cookie"] ?? []).find((c) => c.startsWith("fcl_admin=")) ?? ""
check("step-up succeeds with the admin signature", v.status === 200 && Boolean(setCookie), `status ${v.status}`)
check("fcl_admin cookie has no Domain attribute (host-only)", !/;\s*domain=/i.test(setCookie), setCookie.replace(/=[^;]+/, "=…"))
check("fcl_admin cookie is HttpOnly and SameSite=Strict", /httponly/i.test(setCookie) && /samesite=strict/i.test(setCookie))
check("fcl_admin cookie lasts 8 hours", /max-age=28800/i.test(setCookie))
const reuse = await request("POST", "/api/admin/auth/verify", ADMIN, { cookie: session, body: { token: n.token, signature: bs58.encode(nacl.sign.detached(new TextEncoder().encode(n.message), owner.secretKey)) } })
check("an admin signature can't be replayed", reuse.status === 400 || reuse.status === 401, `status ${reuse.status}`)

const both = `${session}; ${setCookie.split(";")[0]}`
const panel = await request("GET", "/", ADMIN, { cookie: both })
check("owner with both cookies sees the panel", panel.status === 200 && /Overview/.test(panel.body) && /Sign out of admin/.test(panel.body) && !/Connect your wallet to continue|Admin sign-in/.test(panel.body), `status ${panel.status}`)
check("clean URLs on the admin host (/ serves the Overview)", /Overview/.test(panel.body))
for (const path of ["/users", "/billing", "/billing?tab=webhooks", "/billing?tab=revenue", "/content", "/content?tab=images", "/content?tab=reports", "/safety", "/settings", "/domains", "/waitlist", "/team", "/system", "/audit", "/?period=7d"]) {
  const r = await request("GET", path, ADMIN, { cookie: both })
  const broken = /Application error|Internal Server Error|The lab exploded/.test(r.body)
  check(`admin page ${path} renders for the owner`, r.status === 200 && !broken, `status ${r.status}`)
}
const onSite = await request("GET", "/admin", SITE, { cookie: both })
check("even a signed-in admin gets a 404 for /admin on the marketing host", onSite.status === 404)

writeFileSync(JAR_FILE, JSON.stringify({ cookie: both, owner: ownerAddress }))
console.log(failed ? `\n${failed} check(s) failed` : "\nAll admin checks passed")
console.log(`TEST_WALLETS ${ownerAddress}`)
process.exit(failed ? 1 : 0)
