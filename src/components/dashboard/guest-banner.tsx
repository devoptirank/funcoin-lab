"use client"
import { CloudOff } from "lucide-react"
import { useStore } from "@/components/providers/store-provider"
import { ButtonLink } from "@/components/shared/button-link"

export function GuestBanner() {
  const { user, cloudAvailable, ready } = useStore()
  if (!ready || user) return null
  return (
    <div className="glass mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
      <CloudOff className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="flex-1 text-sm text-muted-foreground">
        <strong className="text-foreground">Guest mode.</strong> Your projects are saved in this browser only.
        {cloudAvailable ? " Sign in to sync them and publish websites." : ""}
      </p>
      {cloudAvailable && (
        <ButtonLink href="/login?next=/dashboard" variant="glow" size="lg" className="px-4">
          Sign in
        </ButtonLink>
      )}
    </div>
  )
}
