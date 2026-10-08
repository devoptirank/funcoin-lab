import "server-only"
import { createHash } from "node:crypto"
import { SignJWT, jwtVerify } from "jose"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { PublicKey } from "@solana/web3.js"
import { getBillingStore } from "@/lib/billing/store"
import { adminKey } from "./session"
import type { AdminContext } from "./guard"

/**
 * Wallet-signed confirmation for dangerous admin actions (large credit changes, bans, refunds,
 * pricing, maintenance mode, admin management). The server decides when it's needed, describes the
 * exact action in a message, the admin's wallet signs it, and the server checks that the signature
 * covers exactly the parameters being executed. Each challenge is single-use and lasts 5 minutes.
 */

const TTL = 5 * 60

/** JSON with sorted keys, so the same parameters always produce the same text. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`
  return JSON.stringify(v ?? null)
}

export type StepUpRequest = { action: string; summary: string; params: Record<string, unknown> }

export const stepUpText = (r: StepUpRequest) => `${r.summary}\n\nAction: ${r.action}\nDetails: ${stable(r.params)}`
const digest = (text: string) => createHash("sha256").update(text).digest("hex")

function buildMessage(domain: string, address: string, body: string, nonce: string, issuedAt: string) {
  return [`${domain} admin action, confirm with your Solana account:`, address, "", body, "", `Nonce: ${nonce}`, `Issued At: ${issuedAt}`].join("\n")
}

export async function issueStepUp(ctx: AdminContext, req: StepUpRequest, domain: string) {
  const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(16)))
  const issuedAt = new Date().toISOString()
  const body = stepUpText(req)
  const token = await new SignJWT({ typ: "admin-action", addr: ctx.address, dom: domain, sum: digest(body), nonce, iat2: issuedAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(adminKey())
  return { message: buildMessage(domain, ctx.address, body, nonce, issuedAt), token }
}

/** Verify a signed step-up for exactly this request. Returns the signature to store in the audit log. */
export async function verifyStepUp(ctx: AdminContext, req: StepUpRequest, domain: string, proof: { signature: string; token: string }): Promise<string> {
  const { payload } = await jwtVerify(proof.token, adminKey(), { algorithms: ["HS256"] })
  const body = stepUpText(req)
  if (payload.typ !== "admin-action" || payload.addr !== ctx.address || payload.dom !== domain || payload.sum !== digest(body)) {
    throw Object.assign(new Error("The signed confirmation doesn't match this action"), { status: 401 })
  }
  const message = buildMessage(domain, ctx.address, body, String(payload.nonce), String(payload.iat2))
  if (!nacl.sign.detached.verify(new TextEncoder().encode(message), bs58.decode(proof.signature), new PublicKey(ctx.address).toBytes())) {
    throw Object.assign(new Error("Signature check failed"), { status: 401 })
  }
  const expires = new Date(((payload.exp as number) ?? 0) * 1000).toISOString()
  if (!(await getBillingStore().consumeNonce(`action:${payload.nonce}`, expires))) throw Object.assign(new Error("This confirmation was already used"), { status: 401 })
  return proof.signature
}
