"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"
import { KeyRound, Loader2, ShieldCheck, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useBilling } from "@/components/billing/billing-provider"
import { Button } from "@/components/ui/button"
import { shortAddress } from "@/components/billing/wallet-button"

/**
 * Entry to the admin panel.
 * - connect: no wallet session yet. Generic on purpose: it doesn't say whether this wallet is an admin.
 * - step-up: an admin wallet signs the separate admin message to get the short-lived admin cookie.
 */
export function AdminGate({ mode, address }: { mode: "connect" | "step-up"; address?: string }) {
  const router = useRouter()
  const billing = useBilling()
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [busy, setBusy] = useState(false)

  // After the normal wallet sign-in completes, let the server decide what this wallet can see.
  useEffect(() => {
    if (mode === "connect" && billing.signedIn) router.refresh()
  }, [mode, billing.signedIn, router])

  const walletAddress = wallet.publicKey?.toBase58()
  const wrongWallet = mode === "step-up" && walletAddress && address && walletAddress !== address

  const stepUp = async () => {
    if (!wallet.connected) return setVisible(true)
    if (!wallet.signMessage) return toast.error("This wallet can't sign messages.")
    if (wrongWallet) return toast.error(`Switch your wallet to ${shortAddress(address!)}.`)
    setBusy(true)
    try {
      const n = await fetch("/api/admin/auth/nonce", { method: "POST" })
      const nj = (await n.json().catch(() => ({}))) as { message?: string; token?: string; error?: string }
      if (!n.ok || !nj.message || !nj.token) throw new Error(nj.error || "Couldn't start admin sign-in")
      const signature = bs58.encode(await wallet.signMessage(new TextEncoder().encode(nj.message)))
      const v = await fetch("/api/admin/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature, token: nj.token }) })
      const vj = (await v.json().catch(() => ({}))) as { error?: string }
      if (!v.ok) throw new Error(vj.error || "Admin sign-in failed")
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Admin sign-in failed"
      toast.error(/reject|cancel|declin/i.test(msg) ? "Signature request cancelled" : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        {mode === "connect" ? (
          <>
            <Wallet className="size-6 text-lab" aria-hidden />
            <h1 className="mt-4 text-xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Connect your wallet to continue.</p>
            <Button className="mt-5 w-full" variant="glow" size="lg" onClick={() => void billing.ensureSignedIn()} disabled={billing.signingIn}>
              {billing.signingIn ? <Loader2 className="animate-spin" /> : <Wallet />} {billing.signingIn ? "Check your wallet" : "Connect wallet"}
            </Button>
          </>
        ) : (
          <>
            <ShieldCheck className="size-6 text-lab" aria-hidden />
            <h1 className="mt-4 text-xl font-bold">Admin sign-in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign the admin message with <span className="font-mono text-foreground">{address ? shortAddress(address) : "your wallet"}</span>. It costs nothing and expires after 8 hours.
            </p>
            {wrongWallet && <p className="mt-3 text-sm text-destructive">Your wallet is on {shortAddress(walletAddress!)}. Switch to {shortAddress(address!)}.</p>}
            <Button className="mt-5 w-full" variant="glow" size="lg" onClick={stepUp} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : wallet.connected ? <KeyRound /> : <Wallet />}
              {busy ? "Check your wallet" : wallet.connected ? "Sign admin message" : "Connect wallet"}
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
