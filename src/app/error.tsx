"use client"
import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- mascot artwork */}
        <img src="/mascots/fire.webp" alt="" className="size-28 object-contain" />
        <h1 className="font-heading text-4xl font-extrabold">The lab exploded (a little)</h1>
        <p className="max-w-md text-muted-foreground">Something went wrong. Give it another try.</p>
        <Button variant="glow" size="xl" onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
