"use client"
import { useMemo } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl, type Cluster } from "@solana/web3.js"
import { WalletNotReadyError, type WalletError } from "@solana/wallet-adapter-base"
import { toast } from "sonner"
import "@solana/wallet-adapter-react-ui/styles.css"

export const SOLANA_CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet-beta") as Cluster

/**
 * Wallet connection. `wallets` is empty on purpose: Phantom, Solflare, Backpack and other modern wallets
 * register themselves through the Wallet Standard and appear automatically.
 */
/** Show wallet problems instead of failing silently. Cancelled prompts and auto-connect misses stay quiet. */
function onWalletError(error: WalletError) {
  if (error instanceof WalletNotReadyError) return toast.error("That wallet isn't installed in this browser.")
  const msg = error.message || error.name
  if (/reject|cancel|declin|closed|autoconnect|not connected/i.test(msg)) return
  console.error("[wallet]", error)
  toast.error(msg.length > 140 ? "Your wallet reported an error. Please try again." : msg)
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  // The browser talks to our own relay (/api/solana/rpc), which forwards to the server's private RPC
  // URL. Public RPC endpoints reject browser traffic, and an RPC API key must never ship to clients.
  const endpoint = useMemo(
    () => (typeof window === "undefined" ? clusterApiUrl(SOLANA_CLUSTER) : `${window.location.origin}/api/solana/rpc`),
    [],
  )
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect onError={onWalletError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
