"use client"
import { useEffect, useState } from "react"
import { Check, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useBilling } from "@/components/billing/billing-provider"
import { Button } from "@/components/ui/button"

/** Join the token waitlist with a connected wallet. No email, nothing to sign but the login. */
export function TokenWaitlist() {
  const billing = useBilling()
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!billing.signedIn) return
    let alive = true
    fetch("/api/me/waitlist", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { joined: false }))
      .then((j: { joined?: boolean }) => alive && setJoined(Boolean(j.joined)))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [billing.signedIn])

  const join = async () => {
    if (!billing.signedIn) {
      void billing.ensureSignedIn()
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/me/waitlist", { method: "POST" })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(j.error || "Couldn't join the waitlist")
      setJoined(true)
      toast.success("You're on the waitlist")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't join the waitlist")
    } finally {
      setBusy(false)
    }
  }

  if (joined) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-semibold">
        <Check className="size-5 text-lab" aria-hidden /> You&apos;re on the waitlist
      </p>
    )
  }
  return (
    <Button variant="glow" size="xl" onClick={join} disabled={busy || billing.signingIn}>
      {busy || billing.signingIn ? <Loader2 className="animate-spin" /> : <Wallet />}
      {billing.signedIn ? "Join the waitlist" : "Connect wallet to join"}
    </Button>
  )
}
