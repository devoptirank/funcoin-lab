"use client"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { copyText } from "@/lib/client-api"

/** "7xK…3fQ" with copy and a Solscan link for the configured cluster. Accepts an address or "sol:<address>". */
export function MaskedAddress({ value, link = true }: { value: string; link?: boolean }) {
  const address = value.replace(/^sol:/, "")
  const short = address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : ""
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      <span title={address}>{short}</span>
      <button type="button" className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Copy address" onClick={async () => (await copyText(address)) && toast.success("Copied")}>
        <Copy className="size-3" />
      </button>
      {link && (
        <a href={`https://solscan.io/account/${address}${cluster}`} target="_blank" rel="noopener noreferrer" className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Open on Solscan">
          <ExternalLink className="size-3" />
        </a>
      )}
    </span>
  )
}
