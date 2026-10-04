"use client"
import { MemeSite } from "@/components/site/meme-site"
import type { SiteConfig } from "@/lib/types"

/** A fake browser window framing a live generated site. */
export function BrowserFrame({ url, children, className }: { url: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_100px_-50px_hsl(var(--shadow-tint)/0.9)] ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.03] px-4 py-3">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="mx-auto max-w-xs flex-1 truncate rounded-full bg-foreground/5 px-3 py-1 text-center text-xs text-muted-foreground">🔒 {url}</span>
      </div>
      {children}
    </div>
  )
}

export function SiteShowcase({ site }: { site: SiteConfig }) {
  return (
    <BrowserFrame url={site.brand.domain}>
      <div className="h-[560px] overflow-y-auto overscroll-contain">
        <MemeSite config={site} />
      </div>
    </BrowserFrame>
  )
}
