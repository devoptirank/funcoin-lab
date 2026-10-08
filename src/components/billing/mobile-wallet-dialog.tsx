"use client"
import { ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/** Wallet apps' "open this page in my in-app browser" links. */
function browseLinks() {
  const url = encodeURIComponent(window.location.href)
  const ref = encodeURIComponent(window.location.origin)
  return [
    { name: "Phantom", href: `https://phantom.app/ul/browse/${url}?ref=${ref}` },
    { name: "Solflare", href: `https://solflare.com/ul/v1/browse/${url}?ref=${ref}` },
    // coin_id 501 = Solana
    { name: "Trust Wallet", href: `https://link.trustwallet.com/open_url?coin_id=501&url=${url}` },
    { name: "Coinbase Wallet", href: `https://go.cb-w.com/dapp?cb_url=${url}` },
  ]
}

/**
 * Phone browsers (Safari, Chrome) can't see wallet apps. This sends the visitor into their wallet's
 * built-in browser on the same page, where connecting works.
 */
export function MobileWalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="font-heading text-xl font-extrabold">Open in your wallet app</DialogTitle>
        <DialogDescription>
          Phone browsers can&apos;t connect to wallet apps directly. Open FunCoin Lab inside your wallet&apos;s browser, then tap Connect wallet there.
        </DialogDescription>
        <div className="mt-2 flex flex-col gap-2">
          {open &&
            browseLinks().map((w) => (
              <a key={w.name} href={w.href} className="inline-flex h-12 items-center justify-between rounded-2xl border border-border px-4 font-semibold hover:border-lab-fill/60">
                Open in {w.name} <ExternalLink className="size-4 opacity-60" />
              </a>
            ))}
        </div>
        <p className="text-xs text-muted-foreground">Don&apos;t have a wallet yet? Install Phantom, Solflare, Trust Wallet or Coinbase Wallet from your app store first. On Android, wallet apps also connect directly from Chrome.</p>
      </DialogContent>
    </Dialog>
  )
}
