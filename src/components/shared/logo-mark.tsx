import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-lg font-extrabold tracking-tight", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand coin artwork */}
      <img src="/coins/funcoinlab.webp" alt="" width={36} height={36} className="size-9 transition-transform duration-500 group-hover:rotate-[20deg]" />
      {withText && (
        <span>
          FunCoin<span className="text-lab">Lab</span>
        </span>
      )}
    </Link>
  )
}
