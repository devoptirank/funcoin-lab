import { ArrowDown, ArrowUp, CircleAlert, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

/** Pieces shared by the Operations pages. Server components. */

function change(cur: number, prev: number) {
  if (cur === prev) return { dir: 0, text: "No change" }
  if (prev === 0) return { dir: 1, text: `Up from 0` }
  const pct = ((cur - prev) / prev) * 100
  const r = Math.abs(pct) >= 10 ? Math.round(Math.abs(pct)) : Math.round(Math.abs(pct) * 10) / 10
  return { dir: pct > 0 ? 1 : -1, text: `${pct > 0 ? "Up" : "Down"} ${r}%` }
}

export function KpiTile({ label, cur, prev, format = "number", detail, prevLabel }: { label: string; cur: number; prev: number; format?: "number" | "usd"; detail?: string; prevLabel: string }) {
  const f = (n: number) => (format === "usd" ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : n.toLocaleString("en-US"))
  const c = change(cur, prev)
  const Icon = c.dir > 0 ? ArrowUp : c.dir < 0 ? ArrowDown : Minus
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{f(cur)}</p>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="size-3" aria-hidden />
        <span>
          {c.text} <span className="sr-only">compared with </span>
          <span aria-hidden>vs </span>
          {prevLabel} ({f(prev)})
        </span>
      </p>
      {detail && <p className="text-[11px] text-muted-foreground tabular-nums">{detail}</p>}
    </div>
  )
}

export function NoDatabase({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm", className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      Supabase isn&apos;t connected on this deployment, so the admin panel is read-only and this data is unavailable.
    </p>
  )
}

export function QueryError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <span>Couldn&apos;t load this data: {message}</span>
    </p>
  )
}

/** Link styled as a small button, for CSV exports. A plain anchor so the browser downloads the file. */
export function ExportLink({ href, children = "Export CSV" }: { href: string; children?: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-foreground/5" download>
      {children}
    </a>
  )
}
