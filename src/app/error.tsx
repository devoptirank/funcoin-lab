"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

/** After a new deploy, an open tab can ask for code files that no longer exist. A reload fixes it. */
const isStaleBuild = (e: Error) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(`${e.name} ${e.message}`)

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] crashed:", error)
    if (!isStaleBuild(error)) return
    // Reload once; the flag stops a loop if the reload doesn't help.
    try {
      if (sessionStorage.getItem("fcl:reloaded") !== "1") {
        sessionStorage.setItem("fcl:reloaded", "1")
        window.location.reload()
      }
    } catch {}
  }, [error])

  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- mascot artwork */}
        <img src="/mascots/fire.webp" alt="" className="size-28 object-contain" />
        <h1 className="font-heading text-4xl font-extrabold">The lab exploded (a little)</h1>
        <p className="max-w-md text-muted-foreground">Something went wrong. Try again, or reload the page if it keeps happening.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="glow" size="xl" onClick={reset}>Try again</Button>
          <Button variant="glass" size="xl" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </div>
    </main>
  )
}
