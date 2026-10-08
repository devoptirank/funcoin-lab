import { NextResponse } from "next/server"
import { solanaConfig } from "@/lib/billing/solana"
import { clientKey, rateLimit } from "@/lib/rate-limit"

/**
 * JSON-RPC relay for the browser's Solana connection. The real RPC URL (with its API key) stays on
 * the server, and only the read and send methods a wallet payment needs are forwarded.
 */
const ALLOWED = new Set([
  "getLatestBlockhash",
  "isBlockhashValid",
  "getFeeForMessage",
  "getMinimumBalanceForRentExemption",
  "getRecentPrioritizationFees",
  "simulateTransaction",
  "sendTransaction",
  "getSignatureStatuses",
  "getAccountInfo",
  "getMultipleAccounts",
  "getBalance",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getSlot",
  "getBlockHeight",
  "getEpochInfo",
  "getVersion",
  "getGenesisHash",
])

type RpcCall = { jsonrpc?: string; id?: unknown; method?: unknown; params?: unknown }

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "solana-rpc"), 120, 60_000).ok) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: 429, message: "Too many requests" } }, { status: 429 })
  }
  const raw = await req.text()
  if (raw.length > 200_000) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: 413, message: "Request too large" } }, { status: 413 })
  let body: RpcCall | RpcCall[]
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 })
  }
  const calls = Array.isArray(body) ? body : [body]
  if (!calls.length || calls.length > 20) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } }, { status: 400 })
  const blocked = calls.find((c) => typeof c.method !== "string" || !ALLOWED.has(c.method))
  if (blocked) {
    return NextResponse.json({ jsonrpc: "2.0", id: blocked.id ?? null, error: { code: -32601, message: "Method not allowed" } }, { status: 403 })
  }

  try {
    const res = await fetch(solanaConfig().rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    })
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[solana-rpc] upstream failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: 502, message: "Solana RPC unavailable" } }, { status: 502 })
  }
}
