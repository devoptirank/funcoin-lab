import { cn } from "@/lib/utils"

/** Left-aligned page/section intro. The eyebrow is a plain label, never a pill. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  className?: string
  as?: "h1" | "h2"
}) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-3", align === "center" && "mx-auto items-center text-center", className)}>
      {eyebrow && <p className="text-sm font-semibold text-lab">{eyebrow}</p>}
      <Tag className={cn("font-heading leading-[0.98] font-extrabold tracking-[-0.04em]", Tag === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl")}>
        {title}
      </Tag>
      {description && <p className="max-w-[60ch] text-base text-muted-foreground sm:text-lg">{description}</p>}
    </div>
  )
}
