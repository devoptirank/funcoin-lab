"use client"
import { useEffect, useMemo, useState } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl, type Cluster } from "@solana/web3.js"
import { WalletAdapterNetwork, WalletNotReadyError, type Adapter, type WalletError } from "@solana/wallet-adapter-base"
import { CoinbaseWalletAdapter } from "@solana/wallet-adapter-coinbase"
import { TrustWalletAdapter } from "@solana/wallet-adapter-trust"
import { toast } from "sonner"
import "@solana/wallet-adapter-react-ui/styles.css"

export const SOLANA_CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet-beta") as Cluster
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? ""

/** Show wallet problems instead of failing silently. Cancelled prompts and auto-connect misses stay quiet. */
function onWalletError(error: WalletError) {
  if (error instanceof WalletNotReadyError) return toast.error("That wallet isn't installed in this browser.")
  const msg = error.message || error.name
  if (/reject|cancel|declin|closed|autoconnect|not connected/i.test(msg)) return
  console.error("[wallet]", error)
  toast.error(msg.length > 140 ? "Your wallet reported an error. Please try again." : msg)
}

let mobileRegistered = false

/**
 * Wallets, on funcoinlab.com and app.funcoinlab.com alike:
 * - Wallet Standard (automatic): Phantom, Solflare, Backpack, OKX, Glow, Magic Eden and any other
 *   modern Solana wallet extension or in-app browser.
 * - Coinbase Wallet and Trust Wallet adapters, for versions that don't announce themselves.
 * - Solana Mobile Wallet Adapter: on Android, connect straight to an installed wallet app.
 * - WalletConnect (optional, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID): scan a QR code with a phone wallet.
 *   Loaded only when configured, since it's a large bundle.
 * Adapters that duplicate a Wallet Standard wallet are dropped by the provider automatically.
 */
export function SolanaProvider({ children }: { children: React.ReactNode }) {
  // The browser talks to our own relay (/api/solana/rpc), which forwards to the server's private RPC
  // URL. Public RPC endpoints reject browser traffic, and an RPC API key must never ship to clients.
  const endpoint = useMemo(
    () => (typeof window === "undefined" ? clusterApiUrl(SOLANA_CLUSTER) : `${window.location.origin}/api/solana/rpc`),
    [],
  )
  const base = useMemo<Adapter[]>(() => [new CoinbaseWalletAdapter(), new TrustWalletAdapter()], [])
  const [walletConnect, setWalletConnect] = useState<Adapter | null>(null)

  useEffect(() => {
    // Android phones: offer installed wallet apps through the Solana Mobile protocol.
    if (!mobileRegistered && /Android/i.test(navigator.userAgent)) {
      mobileRegistered = true
      void import("@solana-mobile/wallet-standard-mobile").then(({ registerMwa, createDefaultAuthorizationCache, createDefaultChainSelector, createDefaultWalletNotFoundHandler }) =>
        registerMwa({
          appIdentity: { name: "FunCoin Lab", uri: window.location.origin, icon: "/icon.png" },
          authorizationCache: createDefaultAuthorizationCache(),
          chains: [SOLANA_CLUSTER === "devnet" ? "solana:devnet" : "solana:mainnet"],
          chainSelector: createDefaultChainSelector(),
          onWalletNotFound: createDefaultWalletNotFoundHandler(),
        }),
      )
    }
    if (!WALLETCONNECT_PROJECT_ID) return
    let alive = true
    void import("@solana/wallet-adapter-walletconnect").then(({ WalletConnectWalletAdapter }) => {
      if (!alive) return
      setWalletConnect(
        new WalletConnectWalletAdapter({
          network: SOLANA_CLUSTER === "devnet" ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet,
          options: {
            projectId: WALLETCONNECT_PROJECT_ID,
            metadata: { name: "FunCoin Lab", description: "Meme brand studio", url: window.location.origin, icons: [`${window.location.origin}/icon.png`] },
          },
        }),
      )
    })
    return () => {
      alive = false
    }
  }, [])

  const wallets = useMemo(() => (walletConnect ? [...base, walletConnect] : base), [base, walletConnect])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onWalletError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
