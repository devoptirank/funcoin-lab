"use client"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Shown when a Content query fails (for example the database is unreachable). */
export default function ContentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <CircleAlert className="size-4 text-destructive" aria-hidden /> Couldn&apos;t load content
      </p>
      <p className="text-muted-foreground">The database query failed. Check System health, then try again.{error.digest ? ` (ref ${error.digest})` : ""}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
