import { Navbar } from "@/components/layout/navbar"
import { ButtonLink } from "@/components/shared/button-link"
import { BackgroundFX } from "@/components/shared/background-fx"

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative isolate grid min-h-[80vh] place-items-center px-4 text-center">
        <BackgroundFX />
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- mascot artwork */}
          <img src="/mascots/ghost.webp" alt="" className="size-32 object-contain" />
          <h1 className="font-heading text-5xl font-extrabold">404: meme not found</h1>
          <p className="max-w-md text-muted-foreground">This page wandered off to make a meme of its own. Let&apos;s get you back to the lab.</p>
          <div className="flex gap-3">
            <ButtonLink href="/" variant="glass" size="xl">Home</ButtonLink>
            <ButtonLink href="/create" variant="glow" size="xl">Create an idea</ButtonLink>
          </div>
        </div>
      </main>
    </>
  )
}
