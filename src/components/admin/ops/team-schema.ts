import "server-only"
import { PublicKey } from "@solana/web3.js"
import { z } from "zod"

/** A Solana address (optionally "sol:"-prefixed), normalized to the account id "sol:<address>". */
export const accountId = z
  .string()
  .trim()
  .transform((s) => s.replace(/^sol:/, ""))
  .refine((s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s), "must be a base58 Solana address (32 to 44 characters)")
  .refine((s) => {
    try {
      new PublicKey(s)
      return true
    } catch {
      return false
    }
  }, "is not a valid Solana address")
  .transform((s) => `sol:${s}`)

export const reason = z.string().trim().min(3).max(300)

export const shortAccount = (account: string) => {
  const a = account.replace(/^sol:/, "")
  return a.length > 10 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a
}
