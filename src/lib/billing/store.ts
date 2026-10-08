import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { WELCOME_CREDITS } from "./plans"

/**
 * Credit ledger and payment orders.
 *
 * - With SUPABASE_SERVICE_ROLE_KEY: Postgres (migration 0004), where spend/credit are SQL functions
 *   with row locks, safe across many server instances.
 * - Otherwise: a JSON file in .data/ guarded by an in-process lock. Fine for local development and a
 *   single long-running server; NOT for serverless or multiple instances.
 *
 * Every credit carries a unique `ref` so a payment can never be granted twice.
 */

export type PaymentMethod = "sol" | "usdc" | "nowpayments"
export type OrderStatus = "pending" | "paid" | "expired" | "failed" | "partial"

export type Order = {
  id: string
  accountId: string
  packId: string
  credits: number
  usd: number
  method: PaymentMethod
  /** Amount in the smallest unit (lamports / USDC base units), or the USD price for NOWPayments. */
  amount: string
  currency: string
  recipient: string | null
  reference: string | null
  signature: string | null
  providerId: string | null
  status: OrderStatus
  createdAt: string
  expiresAt: string
  paidAt: string | null
}

export type LedgerEntry = { id: string; accountId: string; delta: number; reason: string; ref: string; createdAt: string }

export interface BillingStore {
  readonly kind: "file" | "supabase"
  /** Create the account if new, with `welcome` one-time credits (defaults to WELCOME_CREDITS). */
  ensureAccount(accountId: string, wallet: string, welcome?: number): Promise<void>
  balance(accountId: string): Promise<number>
  ledger(accountId: string, limit?: number): Promise<LedgerEntry[]>
  /** Atomically spend; returns ok=false (and leaves the balance alone) if there isn't enough. */
  spend(accountId: string, amount: number, reason: string, ref: string): Promise<{ ok: boolean; balance: number }>
  /** Idempotent by ref. Returns false if this ref was already credited. */
  credit(accountId: string, delta: number, reason: string, ref: string): Promise<boolean>
  createOrder(order: Order): Promise<void>
  getOrder(id: string): Promise<Order | null>
  orders(accountId: string, limit?: number): Promise<Order[]>
  /** Mark paid exactly once (pending -> paid) and grant credits. Returns false if already handled. */
  fulfillOrder(id: string, patch: { signature?: string | null; providerId?: string | null }): Promise<boolean>
  setOrderStatus(id: string, status: OrderStatus, patch?: { providerId?: string | null }): Promise<void>
  signatureUsed(signature: string): Promise<boolean>
  /** Single-use sign-in nonces. Returns false if already used. */
  consumeNonce(nonce: string, expiresAt: string): Promise<boolean>
}

// ---------------- File store ----------------

type FileData = {
  accounts: Record<string, { wallet: string; createdAt: string }>
  ledger: LedgerEntry[]
  orders: Record<string, Order>
  nonces: Record<string, string>
}

const FILE = path.join(process.cwd(), ".data", "billing.json")
let cache: FileData | null = null
let chain: Promise<unknown> = Promise.resolve()

async function load(): Promise<FileData> {
  if (cache) return cache
  try {
    cache = JSON.parse(await fs.readFile(FILE, "utf8")) as FileData
  } catch {
    cache = { accounts: {}, ledger: [], orders: {}, nonces: {} }
  }
  return cache
}

async function persist(data: FileData) {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  const tmp = `${FILE}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2))
  await fs.rename(tmp, FILE)
}

/** Serialize every read-modify-write through one promise chain. */
function locked<T>(fn: (data: FileData) => T | Promise<T>, write = true): Promise<T> {
  const run = chain.then(async () => {
    const data = await load()
    const result = await fn(data)
    if (write) await persist(data)
    return result
  })
  chain = run.catch(() => undefined)
  return run
}

const sum = (data: FileData, accountId: string) => data.ledger.reduce((n, e) => (e.accountId === accountId ? n + e.delta : n), 0)
const newId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const fileStore: BillingStore = {
  kind: "file",
  ensureAccount: (accountId, wallet, welcome = WELCOME_CREDITS) =>
    locked((d) => {
      if (d.accounts[accountId]) return
      d.accounts[accountId] = { wallet, createdAt: now() }
      if (welcome > 0) d.ledger.push({ id: newId(), accountId, delta: welcome, reason: "Welcome credits", ref: `welcome:${accountId}`, createdAt: now() })
    }),
  balance: (accountId) => locked((d) => sum(d, accountId), false),
  ledger: (accountId, limit = 50) => locked((d) => d.ledger.filter((e) => e.accountId === accountId).slice(-limit).reverse(), false),
  spend: (accountId, amount, reason, ref) =>
    locked((d) => {
      const bal = sum(d, accountId)
      if (bal < amount) return { ok: false, balance: bal }
      d.ledger.push({ id: newId(), accountId, delta: -amount, reason, ref, createdAt: now() })
      return { ok: true, balance: bal - amount }
    }),
  credit: (accountId, delta, reason, ref) =>
    locked((d) => {
      if (d.ledger.some((e) => e.ref === ref)) return false
      d.ledger.push({ id: newId(), accountId, delta, reason, ref, createdAt: now() })
      return true
    }),
  createOrder: (order) => locked((d) => void (d.orders[order.id] = order)),
  getOrder: (id) => locked((d) => d.orders[id] ?? null, false),
  orders: (accountId, limit = 20) =>
    locked(
      (d) =>
        Object.values(d.orders)
          .filter((o) => o.accountId === accountId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit),
      false,
    ),
  fulfillOrder: (id, patch) =>
    locked((d) => {
      const o = d.orders[id]
      if (!o || o.status === "paid") return false
      Object.assign(o, { status: "paid", paidAt: now(), signature: patch.signature ?? o.signature, providerId: patch.providerId ?? o.providerId })
      const ref = `order:${id}`
      if (!d.ledger.some((e) => e.ref === ref)) {
        d.ledger.push({ id: newId(), accountId: o.accountId, delta: o.credits, reason: `Bought ${o.credits} credits`, ref, createdAt: now() })
      }
      return true
    }),
  setOrderStatus: (id, status, patch) =>
    locked((d) => {
      const o = d.orders[id]
      if (o && o.status !== "paid") Object.assign(o, { status, providerId: patch?.providerId ?? o.providerId })
    }),
  signatureUsed: (signature) => locked((d) => Object.values(d.orders).some((o) => o.signature === signature && o.status === "paid"), false),
  consumeNonce: (nonce, expiresAt) =>
    locked((d) => {
      const t = Date.now()
      for (const [k, exp] of Object.entries(d.nonces)) if (Date.parse(exp) < t) delete d.nonces[k]
      if (d.nonces[nonce]) return false
      d.nonces[nonce] = expiresAt
      return true
    }),
}

// ---------------- Supabase store ----------------

type OrderRow = {
  id: string
  account_id: string
  pack_id: string
  credits: number
  usd: number
  method: PaymentMethod
  amount: string
  currency: string
  recipient: string | null
  reference: string | null
  signature: string | null
  provider_id: string | null
  status: OrderStatus
  created_at: string
  expires_at: string
  paid_at: string | null
}

const fromRow = (r: OrderRow): Order => ({
  id: r.id,
  accountId: r.account_id,
  packId: r.pack_id,
  credits: r.credits,
  usd: Number(r.usd),
  method: r.method,
  amount: r.amount,
  currency: r.currency,
  recipient: r.recipient,
  reference: r.reference,
  signature: r.signature,
  providerId: r.provider_id,
  status: r.status,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
  paidAt: r.paid_at,
})

function supabaseStore(): BillingStore {
  const sb = getSupabaseAdmin()!
  const must = <T,>(res: { data: T; error: { message: string } | null }) => {
    if (res.error) throw new Error(res.error.message)
    return res.data
  }
  return {
    kind: "supabase",
    async ensureAccount(accountId, wallet, welcome = WELCOME_CREDITS) {
      must(await sb.rpc("billing_ensure_account", { p_account: accountId, p_wallet: wallet, p_welcome: welcome }))
    },
    async balance(accountId) {
      return Number(must(await sb.rpc("billing_balance", { p_account: accountId })) ?? 0)
    },
    async ledger(accountId, limit = 50) {
      const rows = must(
        await sb.from("credit_ledger").select("id, account_id, delta, reason, ref, created_at").eq("account_id", accountId).order("created_at", { ascending: false }).limit(limit),
      ) as { id: string; account_id: string; delta: number; reason: string; ref: string; created_at: string }[]
      return rows.map((r) => ({ id: r.id, accountId: r.account_id, delta: r.delta, reason: r.reason, ref: r.ref, createdAt: r.created_at }))
    },
    async spend(accountId, amount, reason, ref) {
      const res = must(await sb.rpc("billing_spend", { p_account: accountId, p_amount: amount, p_reason: reason, p_ref: ref })) as { ok: boolean; balance: number }[]
      return { ok: Boolean(res[0]?.ok), balance: Number(res[0]?.balance ?? 0) }
    },
    async credit(accountId, delta, reason, ref) {
      return Boolean(must(await sb.rpc("billing_credit", { p_account: accountId, p_delta: delta, p_reason: reason, p_ref: ref })))
    },
    async createOrder(o) {
      must(
        await sb.from("payment_orders").insert({
          id: o.id,
          account_id: o.accountId,
          pack_id: o.packId,
          credits: o.credits,
          usd: o.usd,
          method: o.method,
          amount: o.amount,
          currency: o.currency,
          recipient: o.recipient,
          reference: o.reference,
          signature: o.signature,
          provider_id: o.providerId,
          status: o.status,
          created_at: o.createdAt,
          expires_at: o.expiresAt,
        }),
      )
    },
    async getOrder(id) {
      const row = must(await sb.from("payment_orders").select("*").eq("id", id).maybeSingle()) as OrderRow | null
      return row ? fromRow(row) : null
    },
    async orders(accountId, limit = 20) {
      const rows = must(await sb.from("payment_orders").select("*").eq("account_id", accountId).order("created_at", { ascending: false }).limit(limit)) as OrderRow[]
      return rows.map(fromRow)
    },
    async fulfillOrder(id, patch) {
      return Boolean(must(await sb.rpc("billing_fulfill_order", { p_order: id, p_signature: patch.signature ?? null, p_provider_id: patch.providerId ?? null })))
    },
    async setOrderStatus(id, status, patch) {
      must(
        await sb
          .from("payment_orders")
          .update({ status, ...(patch?.providerId ? { provider_id: patch.providerId } : {}) })
          .eq("id", id)
          .neq("status", "paid"),
      )
    },
    async signatureUsed(signature) {
      const row = must(await sb.from("payment_orders").select("id").eq("signature", signature).eq("status", "paid").maybeSingle())
      return Boolean(row)
    },
    async consumeNonce(nonce, expiresAt) {
      const res = await sb.from("auth_nonces").insert({ nonce, expires_at: expiresAt })
      if (res.error?.code === "23505") return false
      if (res.error) throw new Error(res.error.message)
      return true
    },
  }
}

let store: BillingStore | null = null
/**
 * False on serverless hosts (Vercel) without Supabase: the file ledger would be lost between requests,
 * so accounts, credits and checkout stay off rather than take payments that can't be recorded.
 */
export function billingAvailable(): boolean {
  return Boolean(getSupabaseAdmin()) || !process.env.VERCEL
}

export function getBillingStore(): BillingStore {
  if (store) return store
  store = getSupabaseAdmin() ? supabaseStore() : fileStore
  if (store.kind === "file" && process.env.NODE_ENV === "production") {
    console.warn("[billing] Using the local file ledger in production. Set SUPABASE_SERVICE_ROLE_KEY for a durable, multi-instance ledger.")
  }
  return store
}
