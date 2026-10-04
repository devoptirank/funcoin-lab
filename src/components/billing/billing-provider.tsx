"use client"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"
import { toast } from "sonner"
import type { LedgerEntry, Order } from "@/lib/billing/store"
import { BuyCreditsDialog } from "./buy-credits-dialog"

export type BillingMethods = { wallet: boolean; nowpayments: boolean; cluster: string }
export type BillingState = {
  signedIn: boolean
  address: string | null
  balance: number
  ledger: LedgerEntry[]
  orders: Order[]
  methods: BillingMethods
}

type BillingContextValue = BillingState & {
  loading: boolean
  signingIn: boolean
  refresh: () => Promise<void>
  signIn: () => Promise<boolean>
  signOut: () => Promise<void>
  /** Connect + sign in if needed. Resolves true when the user is signed in. `resumeBuy` reopens checkout after. */
  ensureSignedIn: (opts?: { resumeBuy?: boolean }) => Promise<boolean>
  openBuy: (reason?: string) => void
  setSnapshot: (s: Partial<BillingState>) => void
}

const EMPTY: BillingState = { signedIn: false, address: null, balance: 0, ledger: [], orders: [], methods: { wallet: false, nowpayments: false, cluster: "mainnet-beta" } }
const Ctx = createContext<BillingContextValue | null>(null)

const fetchMe = () =>
  fetch("/api/billing/me", { cache: "no-store" }).then((r) => r.json() as Promise<Partial<BillingState>>)

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [state, setState] = useState<BillingState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [buy, setBuy] = useState<{ open: boolean; reason?: string }>({ open: false })
  const wantSignIn = useRef(false)
  const resumeBuy = useRef(false)

  const setSnapshot = useCallback((s: Partial<BillingState>) => setState((prev) => ({ ...prev, ...s })), [])

  const apply = useCallback((json: Partial<BillingState>) => {
    setState({ ...EMPTY, ...json, address: json.address ?? null })
    setLoading(false)
  }, [])
  const refresh = useCallback(() => fetchMe().then(apply), [apply])

  useEffect(() => {
    fetchMe()
      .then(apply)
      .catch(() => setLoading(false))
  }, [apply])

  const signIn = useCallback(async () => {
    const pk = wallet.publicKey
    if (!pk || !wallet.signMessage) {
      if (wallet.connected && !wallet.signMessage) toast.error("This wallet can't sign messages. Try Phantom, Solflare or Backpack.")
      return false
    }
    setSigningIn(true)
    try {
      const address = pk.toBase58()
      const nonceRes = await fetch("/api/auth/nonce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) })
      const { message, token, error } = (await nonceRes.json()) as { message?: string; token?: string; error?: string }
      if (!nonceRes.ok || !message || !token) throw new Error(error || "Couldn't start sign-in")
      const signature = bs58.encode(await wallet.signMessage(new TextEncoder().encode(message)))
      const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, signature, token }) })
      const json = (await res.json()) as Partial<BillingState> & { error?: string }
      if (!res.ok) throw new Error(json.error || "Sign-in failed")
      setState({ ...EMPTY, ...json, address: json.address ?? address })
      toast.success("Wallet connected", { description: `${json.balance ?? 0} credits available` })
      if (resumeBuy.current) {
        resumeBuy.current = false
        setBuy({ open: true })
      }
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed"
      toast.error(/reject|declin|cancel/i.test(msg) ? "Signature request cancelled" : msg)
      return false
    } finally {
      setSigningIn(false)
    }
  }, [wallet])

  // After the wallet modal connects, continue the sign-in the user started.
  useEffect(() => {
    if (wallet.connected && wantSignIn.current && !state.signedIn) {
      wantSignIn.current = false
      void signIn()
    }
  }, [wallet.connected, state.signedIn, signIn])

  // If the user switches to a different wallet, drop the old session.
  useEffect(() => {
    const current = wallet.publicKey?.toBase58()
    if (state.signedIn && current && state.address && current !== state.address) {
      void fetch("/api/auth/logout", { method: "POST" }).then(refresh)
    }
  }, [wallet.publicKey, state.signedIn, state.address, refresh])

  const ensureSignedIn = useCallback(async (opts?: { resumeBuy?: boolean }) => {
    if (state.signedIn) return true
    if (opts?.resumeBuy) resumeBuy.current = true
    if (!wallet.connected) {
      wantSignIn.current = true
      setVisible(true)
      return false
    }
    return signIn()
  }, [state.signedIn, wallet.connected, setVisible, signIn])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await wallet.disconnect().catch(() => undefined)
    await refresh()
  }, [wallet, refresh])

  const openBuy = useCallback((reason?: string) => setBuy({ open: true, reason }), [])

  return (
    <Ctx.Provider value={{ ...state, loading, signingIn, refresh, signIn, signOut, ensureSignedIn, openBuy, setSnapshot }}>
      {children}
      <BuyCreditsDialog open={buy.open} reason={buy.reason} onOpenChange={(open) => setBuy((b) => ({ ...b, open }))} />
    </Ctx.Provider>
  )
}

export function useBilling() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useBilling must be used inside <BillingProvider>")
  return ctx
}
