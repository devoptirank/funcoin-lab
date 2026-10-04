import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-[var(--lab)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-transform duration-300 group-hover:-rotate-12">
        <span aria-hidden>🧪</span>
      </span>
      {withText && (
        <span>
          FunCoin<span className="text-lab">Lab</span>
        </span>
      )}
    </Link>
  )
}
