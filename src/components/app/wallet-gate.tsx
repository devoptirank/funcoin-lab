"use client"
import { Loader2, ShieldCheck, Wallet, Zap } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useBilling } from "@/components/billing/billing-provider"
import { Button } from "@/components/ui/button"
import { MascotArt } from "@/components/shared/mascot-art"
import { WELCOME_CREDITS } from "@/lib/billing/plans"

/**
 * The app needs a connected wallet, nothing else: no email, no password. `initialSignedIn` comes
 * from the server session so signed-in users never see a flash of the connect screen.
 */
export function WalletGate({ initialSignedIn, children }: { initialSignedIn: boolean; children: React.ReactNode }) {
  const billing = useBilling()
  const wallet = useWallet()
  const signedIn = billing.loading ? initialSignedIn : billing.signedIn

  if (signedIn) return <>{children}</>

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center sm:py-16">
      <MascotArt value="lab" className="size-28" />
      <div>
        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">Connect your wallet</h1>
        <p className="mt-3 text-muted-foreground">
          Your Solana wallet is your account. No email, no password. Your projects, websites and credits are saved to your wallet address.
        </p>
      </div>
      <Button variant="glow" size="xl" className="w-full max-w-xs" onClick={() => void billing.ensureSignedIn()} disabled={billing.signingIn}>
        {billing.signingIn ? <Loader2 className="animate-spin" /> : <Wallet />}
        {billing.signingIn ? "Check your wallet" : wallet.connected ? "Sign in with wallet" : "Connect wallet"}
      </Button>
      <ul className="grid w-full gap-3 text-left text-sm sm:grid-cols-2">
        <li className="glass flex items-start gap-2.5 rounded-2xl p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lab" aria-hidden />
          <span>Signing in is a free message signature. It never moves funds or costs gas.</span>
        </li>
        <li className="glass flex items-start gap-2.5 rounded-2xl p-4">
          <Zap className="mt-0.5 size-4 shrink-0 text-lab" aria-hidden />
          <span>New wallets get {WELCOME_CREDITS} free credits for AI images.</span>
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">Works with Phantom, Solflare, Backpack and other Solana wallets.</p>
    </div>
  )
}
