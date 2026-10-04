"use client"
import { useState } from "react"
import Link from "next/link"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram, Transaction, type TransactionInstruction } from "@solana/web3.js"
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import { Check, Coins, ExternalLink, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CREDIT_PACKS } from "@/lib/billing/plans"
import type { Order } from "@/lib/billing/store"
import { burst } from "@/lib/burst"
import { cn } from "@/lib/utils"
import { useBilling, type BillingState } from "./billing-provider"

type Method = "sol" | "usdc" | "nowpayments"
type Phase = "idle" | "creating" | "wallet" | "confirming" | "paid"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function withReference(ix: TransactionInstruction, reference: string) {
  ix.keys.push({ pubkey: new PublicKey(reference), isSigner: false, isWritable: false })
  return ix
}

export function BuyCreditsDialog({ open, reason, onOpenChange }: { open: boolean; reason?: string; onOpenChange: (open: boolean) => void }) {
  const billing = useBilling()
  const wallet = useWallet()
  const { connection } = useConnection()
  const [packId, setPackId] = useState(CREDIT_PACKS.find((p) => p.best)?.id ?? CREDIT_PACKS[0].id)
  const [method, setMethod] = useState<Method>("usdc")
  const [phase, setPhase] = useState<Phase>("idle")
  const [detail, setDetail] = useState<string | null>(null)
  const pack = CREDIT_PACKS.find((p) => p.id === packId)!
  const busy = phase !== "idle" && phase !== "paid"

  const walletAvailable = billing.methods.wallet
  const npAvailable = billing.methods.nowpayments

  // Signing in happens outside this modal (wallet pickers can't sit on top of a modal dialog);
  // checkout reopens automatically once the wallet is signed in.
  const signInFirst = () => {
    onOpenChange(false)
    void billing.ensureSignedIn({ resumeBuy: true })
  }

  const payWithWallet = async (m: "sol" | "usdc") => {
    if (!billing.signedIn) return signInFirst()
    if (!wallet.publicKey || !wallet.sendTransaction) return toast.error("Connect a wallet first")
    setPhase("creating")
    setDetail(null)
    try {
      const res = await fetch("/api/billing/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId, method: m }) })
      const json = (await res.json()) as { order?: Order; display?: string; mint?: string | null; error?: string }
      if (!res.ok || !json.order) throw new Error(json.error || "Couldn't create the order")
      const { order } = json
      setDetail(`Approve ${json.display} in your wallet`)
      setPhase("wallet")

      const payer = wallet.publicKey
      const recipient = new PublicKey(order.recipient!)
      const tx = new Transaction()
      if (m === "sol") {
        tx.add(withReference(SystemProgram.transfer({ fromPubkey: payer, toPubkey: recipient, lamports: BigInt(order.amount) }), order.reference!))
      } else {
        const mint = new PublicKey(json.mint!)
        const from = getAssociatedTokenAddressSync(mint, payer)
        const to = getAssociatedTokenAddressSync(mint, recipient)
        tx.add(createAssociatedTokenAccountIdempotentInstruction(payer, to, recipient, mint))
        tx.add(withReference(createTransferCheckedInstruction(from, mint, to, payer, BigInt(order.amount), 6), order.reference!))
      }
      const signature = await wallet.sendTransaction(tx, connection)

      setPhase("confirming")
      setDetail("Confirming on Solana...")
      for (let i = 0; i < 45; i++) {
        const c = await fetch(`/api/billing/orders/${order.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature }) })
        const cj = (await c.json()) as Partial<BillingState> & { status?: string; reason?: string }
        if (cj.status === "paid") {
          billing.setSnapshot(cj)
          setPhase("paid")
          setDetail(`${order.credits} credits added`)
          burst(document.querySelector("[data-credits-pill]"))
          toast.success(`${order.credits} credits added`)
          return
        }
        if (cj.status === "failed" || cj.status === "expired") throw new Error(cj.reason || "Payment could not be verified")
        await sleep(2500)
      }
      throw new Error("Still confirming. If you paid, your credits will appear shortly in Billing.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed"
      toast.error(/reject|declin|cancel/i.test(msg) ? "Transaction cancelled" : msg)
      setPhase("idle")
      setDetail(null)
    }
  }

  const payWithNowPayments = async () => {
    if (!billing.signedIn) return signInFirst()
    setPhase("creating")
    try {
      const res = await fetch("/api/billing/nowpayments/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId }) })
      const json = (await res.json()) as { invoiceUrl?: string; error?: string }
      if (!res.ok || !json.invoiceUrl) throw new Error(json.error || "Couldn't start checkout")
      window.location.href = json.invoiceUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed")
      setPhase("idle")
    }
  }

  const pay = () => (method === "nowpayments" ? payWithNowPayments() : payWithWallet(method))
  const methodEnabled = method === "nowpayments" ? npAvailable : walletAvailable

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return
        onOpenChange(o)
        if (!o) {
          setPhase("idle")
          setDetail(null)
        }
      }}
    >
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold">Buy credits</DialogTitle>
          <DialogDescription>{reason ?? "Credits pay for AI images: logos, mascots, memes and banners. They never expire."}</DialogDescription>
        </DialogHeader>

        {phase === "paid" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-lab-fill text-lab-ink">
              <Check className="size-7" strokeWidth={3} />
            </span>
            <p className="font-heading text-xl font-bold">{detail}</p>
            <p className="text-sm text-muted-foreground">New balance: {billing.balance} credits</p>
            <Button variant="glow" size="lg" className="px-5" onClick={() => onOpenChange(false)}>
              Back to the lab
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div role="radiogroup" aria-label="Credit pack" className="grid gap-2 sm:grid-cols-3">
              {CREDIT_PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={packId === p.id}
                  disabled={busy}
                  onClick={() => setPackId(p.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors",
                    packId === p.id ? "border-transparent bg-lab-fill text-lab-ink" : "border-border hover:border-lab-fill/70",
                  )}
                >
                  {p.best && <span className="absolute top-2 right-2 rounded bg-foreground/10 px-1.5 text-[10px] font-semibold">Popular</span>}
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span className="font-heading text-3xl font-black">{p.credits}</span>
                  <span className="text-xs opacity-75">credits · ${p.usd}</span>
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Pay with</p>
              <div role="radiogroup" aria-label="Payment method" className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: "usdc", label: "USDC", sub: "Solana wallet", icon: Wallet, on: walletAvailable },
                    { id: "sol", label: "SOL", sub: "Solana wallet", icon: Wallet, on: walletAvailable },
                    { id: "nowpayments", label: "Other crypto", sub: "BTC, ETH, USDT and more", icon: Coins, on: npAvailable },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={method === m.id}
                    disabled={busy}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      method === m.id ? "border-lab-fill bg-lab-fill/20 ring-2 ring-lab-fill/50" : "border-border hover:border-lab-fill/60",
                      !m.on && "opacity-60",
                    )}
                  >
                    <m.icon className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.on ? m.sub : "Not set up yet"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button variant="glow" size="xl" onClick={pay} disabled={busy || !methodEnabled}>
              {busy ? <Loader2 className="animate-spin" /> : method === "nowpayments" ? <ExternalLink /> : <Wallet />}
              {busy ? detail ?? "Preparing..." : billing.signedIn ? `Pay $${pack.usd} for ${pack.credits} credits` : "Connect wallet to continue"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {method === "nowpayments"
                ? "You'll be sent to NOWPayments to pay in the coin of your choice. Credits arrive once the payment is confirmed."
                : `Paid on Solana ${billing.methods.cluster === "devnet" ? "devnet (test network)" : "mainnet"}, verified on-chain by our server. SOL prices are locked for 15 minutes.`}{" "}
              Credits are for FunCoin Lab tools only and have no cash value. <Link href="/terms" className="underline underline-offset-4">Terms</Link>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
