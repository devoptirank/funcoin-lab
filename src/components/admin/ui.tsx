import Link from "next/link"
import { cn } from "@/lib/utils"
export { When } from "./local-time"

/** Shared building blocks for admin pages: dense, calm and accessible. */

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

/** Horizontally scrollable table wrapper, so wide tables never break phone layouts. */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-2 [&_td]:py-2 [&_td]:align-top [&_th]:px-2 [&_th]:pb-2 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
        {children}
      </table>
    </div>
  )
}

const TONES = {
  neutral: "bg-foreground/10",
  good: "bg-[color-mix(in_oklab,var(--lab)_30%,transparent)]",
  warn: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  bad: "bg-destructive/15 text-destructive",
} as const

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cn("inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONES[tone])}>{children}</span>
}

/** Map common statuses to a tone. */
export function statusTone(status: string | null | undefined): keyof typeof TONES {
  if (!status) return "neutral"
  if (["paid", "active", "ok", "actioned", "finished", "live", "set"].includes(status)) return "good"
  if (["pending", "partial", "suspended", "hidden", "open", "confirming", "waiting"].includes(status)) return "warn"
  if (["failed", "expired", "banned", "removed", "missing", "invalid", "down"].includes(status)) return "bad"
  return "neutral"
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

/** Prev/next links that keep the current filters. */
export function Pager({ base, params, page, hasMore }: { base: string; params: Record<string, string>; page: number; hasMore: boolean }) {
  const href = (p: number) => `${base}?${new URLSearchParams({ ...params, page: String(p) }).toString()}`
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="rounded-lg border border-border px-3 py-1.5 hover:bg-foreground/5">Previous</Link> : <span />}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore ? <Link href={href(page + 1)} className="rounded-lg border border-border px-3 py-1.5 hover:bg-foreground/5">Next</Link> : <span />}
    </nav>
  )
}

/** GET filter form: submits to the same page, so filters live in the URL. */
export function Filters({ action, children }: { action: string; children: React.ReactNode }) {
  return (
    <form action={action} method="get" className="mb-4 flex flex-wrap items-end gap-2 text-sm [&_input]:h-9 [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:px-2 [&_select]:h-9 [&_select]:rounded-lg [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:px-2 [&_label]:flex [&_label]:flex-col [&_label]:gap-1 [&_label]:text-xs [&_label]:text-muted-foreground">
      {children}
      <button type="submit" className="h-9 rounded-lg bg-foreground px-3 font-medium text-background">Apply</button>
    </form>
  )
}

export const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
