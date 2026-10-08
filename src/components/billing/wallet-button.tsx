"use client"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { ArrowRight, Copy, LogOut, Receipt, Wallet, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copyText } from "@/lib/client-api"
import { appHref } from "@/lib/hosts"
import { cn } from "@/lib/utils"
import { useBilling } from "./billing-provider"

export const shortAddress = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

export const openApp = () => window.location.assign(appHref("/dashboard", window.location.host))

/**
 * Navbar wallet control.
 * - `site` (marketing): "Launch app" connects the wallet, signs in, then opens the app dashboard.
 * - `app`: connect, credits balance and the account menu.
 */
export function WalletButton({ variant = "app", block = false }: { variant?: "site" | "app"; block?: boolean }) {
  const billing = useBilling()
  const wallet = useWallet()

  if (variant === "site") {
    if (billing.signedIn) {
      return (
        <Button variant="glow" size="lg" onClick={openApp} className={cn("px-4", block && "w-full")}>
          <span className="font-mono text-xs opacity-80">{shortAddress(billing.address!)}</span> Open app <ArrowRight />
        </Button>
      )
    }
    return (
      <Button variant="glow" size="lg" onClick={() => void billing.ensureSignedIn({ goToApp: true })} disabled={billing.signingIn} className={cn("px-4", block && "w-full")}>
        <Wallet /> {billing.signingIn ? "Check your wallet" : "Launch app"}
      </Button>
    )
  }

  if (!billing.signedIn) {
    const needsSign = wallet.connected
    return (
      <Button variant="glass" size="lg" onClick={() => void billing.ensureSignedIn()} disabled={billing.signingIn || billing.loading} className="px-3">
        <Wallet />
        <span className="hidden sm:inline">{billing.signingIn ? "Check your wallet" : needsSign ? "Sign in" : "Connect wallet"}</span>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        data-credits-pill
        onClick={() => billing.openBuy()}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold tabular-nums hover:border-lab-fill/70"
        aria-label={`${billing.balance} credits. Buy more`}
      >
        <Zap className="size-4 text-lab" aria-hidden />
        {billing.balance}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-full bg-lab-fill px-3 font-mono text-xs font-semibold text-lab-ink" aria-label="Wallet menu">
          {shortAddress(billing.address!)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-mono text-xs">{shortAddress(billing.address!)}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={async () => {
              if (await copyText(billing.address!)) toast.success("Address copied")
            }}
          >
            <Copy /> Copy address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => billing.openBuy()}>
            <Zap /> Buy credits
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/billing" />}>
            <Receipt /> Billing & history
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void billing.signOut()}>
            <LogOut /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
