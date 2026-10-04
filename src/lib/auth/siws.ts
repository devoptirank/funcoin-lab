import "server-only"
import { SignJWT, jwtVerify } from "jose"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { PublicKey } from "@solana/web3.js"
import { sessionKey } from "./session"

// Sign-In With Solana: the server issues a short-lived signed nonce, the wallet signs a human-readable
// message containing it, and we verify the ed25519 signature against the wallet's public key.

const NONCE_TTL = 5 * 60

export function buildSignInMessage(domain: string, address: string, nonce: string, issuedAt: string) {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    "Sign in to FunCoin Lab. This does not send a transaction or cost anything.",
    "",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n")
}

export async function issueNonce(address: string) {
  new PublicKey(address) // throws on an invalid address
  const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(16)))
  const issuedAt = new Date().toISOString()
  const token = await new SignJWT({ nonce, addr: address, iat2: issuedAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${NONCE_TTL}s`)
    .sign(sessionKey())
  return { nonce, issuedAt, token }
}

export async function verifySignIn(input: { domain: string; address: string; signature: string; token: string }) {
  const { payload } = await jwtVerify(input.token, sessionKey(), { algorithms: ["HS256"] })
  if (payload.addr !== input.address || typeof payload.nonce !== "string" || typeof payload.iat2 !== "string") {
    throw new Error("Sign-in request doesn't match this wallet")
  }
  const message = buildSignInMessage(input.domain, input.address, payload.nonce, payload.iat2)
  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    bs58.decode(input.signature),
    new PublicKey(input.address).toBytes(),
  )
  if (!ok) throw new Error("Signature check failed")
  return { nonce: payload.nonce, expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString() }
}
