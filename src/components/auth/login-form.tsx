"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ButtonLink } from "@/components/shared/button-link"
import { getSupabaseBrowser } from "@/lib/supabase/client"

export function LoginForm() {
  const sb = getSupabaseBrowser()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const next = params.get("next") ?? "/dashboard"
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined

  if (!sb) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-muted-foreground">
          Accounts aren&apos;t configured on this deployment yet, so you&apos;re in <strong className="text-foreground">guest mode</strong>: everything you create is saved in
          this browser.
        </p>
        <p className="text-xs text-muted-foreground">Admins: set SUPABASE_URL and SUPABASE_ANON_KEY to enable sign-in, sync and publishing.</p>
        <ButtonLink href="/dashboard" variant="glow" size="xl">
          Continue as guest
        </ButtonLink>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>📬</span>
        <h2 className="font-heading text-2xl font-bold">Check your inbox</h2>
        <p className="text-muted-foreground">We sent a magic link to {email}. Click it to sign in.</p>
        <Button variant="ghost" onClick={() => setSent(false)}>Use a different email</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {params.get("error") && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">That sign-in link didn&apos;t work. Please try again.</p>}
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
          setLoading(false)
          if (error) toast.error(error.message)
          else setSent(true)
        }}
      >
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-2xl text-base" />
        <Button type="submit" variant="glow" size="xl" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Mail />} Send magic link
        </Button>
      </form>
      {process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true" && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="glass" size="xl" onClick={() => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })}>
            Continue with Google
          </Button>
        </>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Or keep creating as a guest. Your work is saved in this browser.
      </p>
    </div>
  )
}
