import { cn } from "@/lib/utils"

export function EmptyState({
  emoji = "🫥",
  title,
  description,
  action,
  className,
}: {
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("glass flex flex-col items-center gap-3 rounded-3xl border-dashed px-6 py-14 text-center", className)}>
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="font-heading text-xl font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
