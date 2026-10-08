"use client"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { copyText } from "@/lib/client-api"
import { cn } from "@/lib/utils"

/** The official contract address, full length (never shortened, so people can compare it) with copy. */
export function ContractAddress({ ca, className }: { ca: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={cn("flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-background/60 p-1.5 pl-4", className)}>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">CA</span>
      <code className="min-w-0 flex-1 font-mono text-sm break-all select-all">{ca}</code>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(ca)) {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
          }
        }}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-lab-fill px-3 text-sm font-semibold text-lab-ink"
        aria-label="Copy contract address"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
