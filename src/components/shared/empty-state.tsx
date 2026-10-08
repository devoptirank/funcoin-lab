import { mascotUrl } from "@/lib/mascots"
import { cn } from "@/lib/utils"

/** Empty state with mascot artwork from the library (defaults to the FunCoin Lab flask). */
export function EmptyState({
  mascot = "lab",
  title,
  description,
  action,
  className,
}: {
  mascot?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-[2rem] border border-dashed border-border px-6 py-14 text-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static mascot artwork */}
      <img src={mascotUrl(mascot)} alt="" className="size-24 object-contain" />
      <h3 className="font-heading text-xl font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
