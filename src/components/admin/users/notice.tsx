import { CircleAlert } from "lucide-react"

/** Calm inline notice for "Supabase isn't connected" and query errors. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

/** Readable message for a failed admin read. */
export function readError(error: unknown): string {
  const status = (error as { status?: number }).status
  if (status === 503) return "Supabase isn't connected on this deployment, so user data is unavailable and the panel is read-only."
  return `Couldn't load user data: ${error instanceof Error ? error.message : "unknown error"}. Try again in a moment.`
}
