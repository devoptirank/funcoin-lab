import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

/** Small label for generated or example brand concepts. */
export function FictionalBadge({ className, label = "Brand concept" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-border bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground", className)}>
      <FlaskConical className="size-3 text-lab" aria-hidden />
      {label}
    </span>
  )
}

export function ConceptDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Not financial advice. FunCoin Lab provides branding, design and website tools. Crypto assets are risky: do your own research, check names and logos for
      trademarks, and follow the rules where you launch.
    </p>
  )
}
