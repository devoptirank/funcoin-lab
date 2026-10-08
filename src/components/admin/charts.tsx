import { cn } from "@/lib/utils"

/**
 * Small hand-rolled charts for the admin panel. Server-rendered, no library, no motion. The SVG
 * only draws the bars (it stretches to the container); every label is HTML so text never scales.
 * Each chart has an aria label with a summary and a visually hidden table with the exact numbers.
 */

export type Series = { name: string; color: string }
export type BarPoint = { key: string; label: string; values: number[] }

const SERIES_COLORS = ["var(--chart-2)", "var(--chart-4)", "var(--chart-3)", "var(--chart-5)"]
export const seriesColor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length]

function fmt(n: number, format: "number" | "usd") {
  return format === "usd"
    ? `$${n.toLocaleString("en-US", { minimumFractionDigits: n >= 1000 ? 0 : 2, maximumFractionDigits: n >= 1000 ? 0 : 2 })}`
    : n.toLocaleString("en-US")
}

/** Vertical bars over time, optionally stacked by series. */
export function BarChart({
  title,
  data,
  series = [{ name: "Value", color: seriesColor(0) }],
  format = "number",
  height = 140,
  className,
}: {
  title: string
  data: BarPoint[]
  series?: Series[]
  format?: "number" | "usd"
  height?: number
  className?: string
}) {
  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0))
  const max = Math.max(0, ...totals)
  const sum = totals.reduce((a, b) => a + b, 0)
  const n = Math.max(1, data.length)
  const W = n * 10
  const H = 100
  const gap = n > 60 ? 1 : 2
  const peak = max ? data[totals.indexOf(max)] : null
  const summary = `${title}. ${data.length} days, total ${fmt(sum, format)}${peak ? `, highest ${fmt(max, format)} on ${peak.label}` : ""}.`
  const mid = data[Math.floor((data.length - 1) / 2)]

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">Total {fmt(sum, format)}</span>
      </figcaption>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-hidden>
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: s.color }} /> {s.name}
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <div className="flex w-12 shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums" style={{ height }} aria-hidden>
          <span>{fmt(max, format)}</span>
          <span>0</span>
        </div>
        <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="min-w-0 flex-1 overflow-visible" style={{ height }}>
          <line x1={0} x2={W} y1={0} y2={0} stroke="var(--border)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={H} y2={H} stroke="var(--muted-foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {max > 0 &&
            data.map((d, i) => {
              let y = H
              const x = i * 10 + gap / 2
              return (
                <g key={d.key}>
                  <title>{`${d.label}: ${series.length > 1 ? d.values.map((v, j) => `${series[j]?.name} ${fmt(v, format)}`).join(", ") + `, total ${fmt(totals[i], format)}` : fmt(totals[i], format)}`}</title>
                  <rect x={i * 10} y={0} width={10} height={H} fill="transparent" />
                  {d.values.map((v, j) => {
                    if (v <= 0) return null
                    const h = Math.max(0.8, (v / max) * H)
                    y -= h
                    return <rect key={j} x={x} y={y} width={10 - gap} height={h} fill={series[j]?.color ?? seriesColor(j)} />
                  })}
                </g>
              )
            })}
        </svg>
      </div>
      <div className="ml-14 flex justify-between text-[10px] text-muted-foreground" aria-hidden>
        <span>{data[0]?.label}</span>
        {data.length > 4 && <span>{mid?.label}</span>}
        <span>{data[data.length - 1]?.label}</span>
      </div>
      {max === 0 && <p className="text-center text-xs text-muted-foreground">No data in this period.</p>}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {series.map((s) => (
              <th key={s.name} scope="col">
                {s.name}
              </th>
            ))}
            {series.length > 1 && <th scope="col">Total</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              {series.map((s, j) => (
                <td key={s.name}>{fmt(d.values[j] ?? 0, format)}</td>
              ))}
              {series.length > 1 && <td>{fmt(totals[i], format)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Horizontal bars for categories (images by type, clicks by source). Plain HTML, readable by screen readers as a list. */
export function HBarChart({ title, data, format = "number", className }: { title: string; data: { label: string; value: number }[]; format?: "number" | "usd"; className?: string }) {
  const max = Math.max(0, ...data.map((d) => d.value))
  const total = data.reduce((a, d) => a + d.value, 0)
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">Total {fmt(total, format)}</span>
      </figcaption>
      {data.length === 0 || max === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No data in this period.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data.map((d) => (
            <li key={d.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-xs">
              <span className="truncate" title={d.label}>
                {d.label}
              </span>
              <span className="h-3 rounded-sm bg-foreground/[0.06]" aria-hidden>
                <span className="block h-full rounded-sm" style={{ width: `${Math.max(1, (d.value / max) * 100)}%`, background: seriesColor(0) }} />
              </span>
              <span className="tabular-nums">
                {fmt(d.value, format)}
                <span className="sr-only"> ({total ? Math.round((d.value / total) * 100) : 0}% of total)</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}
