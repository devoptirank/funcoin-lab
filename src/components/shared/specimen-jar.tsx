import { cn } from "@/lib/utils"

/** Glass jar framing for a mascot: a lid, a glassy body and a floor shadow. Pure CSS. */
export function SpecimenJar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-xs", className)}>
      <div className="mx-auto h-5 w-[62%] rounded-t-lg border border-border bg-foreground/15 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_25%,transparent)]" />
      <div className="mx-auto h-3 w-[70%] rounded-b-md border-x border-b border-border bg-foreground/[0.06]" />
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--foreground)_7%,transparent),transparent_40%,color-mix(in_oklab,var(--lab)_8%,transparent))] p-6 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]">
        <span aria-hidden className="absolute top-6 left-5 h-[60%] w-2 rounded-full bg-foreground/10" />
        {children}
      </div>
      <div aria-hidden className="mx-auto mt-3 h-3 w-3/4 rounded-[50%] bg-foreground/10 blur-md" />
    </div>
  )
}
