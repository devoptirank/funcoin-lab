"use client"
import { Check, type LucideIcon } from "lucide-react"
import { mascotUrl } from "@/lib/mascots"
import { cn } from "@/lib/utils"

/** Large selectable card used by the generator steps and tool pickers. Selected = solid lab-lime. */
export function OptionPill({
  selected,
  onClick,
  art,
  icon: Icon,
  label,
  hint,
  className,
}: {
  selected: boolean
  onClick: () => void
  /** Mascot library key shown as artwork. */
  art?: string
  icon?: LucideIcon
  label: string
  hint?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98]",
        selected
          ? "border-transparent bg-lab-fill text-lab-ink shadow-[0_10px_24px_-14px_hsl(var(--shadow-tint)/0.9),inset_0_1px_0_rgba(255,255,255,0.45)]"
          : "border-border bg-card hover:border-lab-fill/70 hover:bg-foreground/[0.03]",
        className,
      )}
    >
      {art && (
        // eslint-disable-next-line @next/next/no-img-element -- static mascot artwork
        <img src={mascotUrl(art)} alt="" className="size-10 shrink-0 object-contain transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
      )}
      {Icon && (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", selected ? "bg-lab-ink/10" : "bg-foreground/5")} aria-hidden>
          <Icon className="size-5" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{label}</span>
        {hint && <span className={cn("truncate text-xs", selected ? "text-lab-ink/70" : "text-muted-foreground")}>{hint}</span>}
      </span>
      {selected && (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lab-ink text-[var(--lab)]" aria-hidden>
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
