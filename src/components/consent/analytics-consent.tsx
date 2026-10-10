"use client"
import Link from "next/link"
import Script from "next/script"
import { useSyncExternalStore } from "react"
import { GA_ID, analyticsAllowed, analyticsConfigured, consentCookie, readConsent, type Consent } from "@/lib/consent"
import { sharedCookieDomain } from "@/lib/hosts"

const CHANGED = "fcl:consent-changed"
const OPEN = "fcl:cookie-settings"

// "unknown" on the server and during hydration, so the banner never flashes for people who chose.
type State = { consent: Consent | null | "unknown"; open: boolean }
let settingsOpen = false
let snapshot: State = { consent: "unknown", open: false }
const SERVER: State = { consent: "unknown", open: false }

function getSnapshot(): State {
  const consent = readConsent(document.cookie)
  if (snapshot.consent !== consent || snapshot.open !== settingsOpen) snapshot = { consent, open: settingsOpen }
  return snapshot
}
function subscribe(cb: () => void) {
  const onOpen = () => {
    settingsOpen = true
    cb()
  }
  window.addEventListener(CHANGED, cb)
  window.addEventListener(OPEN, onOpen)
  return () => {
    window.removeEventListener(CHANGED, cb)
    window.removeEventListener(OPEN, onOpen)
  }
}

type Gtag = (...args: unknown[]) => void

function choose(value: Consent) {
  document.cookie = consentCookie(value, { domain: sharedCookieDomain(location.hostname), secure: location.protocol === "https:" })
  settingsOpen = false
  const w = window as unknown as Record<string, unknown> & { gtag?: Gtag }
  if (value === "denied") {
    // Stop an already loaded tag and remove its cookies.
    w[`ga-disable-${GA_ID}`] = true
    w.gtag?.("consent", "update", { analytics_storage: "denied" })
    const domain = sharedCookieDomain(location.hostname)
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim()
      if (!/^_ga/.test(name)) continue
      document.cookie = `${name}=; Path=/; Max-Age=0`
      if (domain) document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.${domain}`
    }
  } else {
    w[`ga-disable-${GA_ID}`] = false
    w.gtag?.("consent", "update", { analytics_storage: "granted" })
  }
  window.dispatchEvent(new Event(CHANGED))
}

/** Footer link that reopens the banner so the choice can be changed. Nothing when analytics is off. */
export function CookieSettingsLink({ className }: { className?: string }) {
  if (!analyticsConfigured) return null
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN))}>
      Cookie settings
    </button>
  )
}

/**
 * The consent banner and, only after Accept, the Google Analytics tag. Consent Mode starts with
 * everything denied; analytics storage is granted on Accept and advertising signals never are.
 */
export function AnalyticsConsent() {
  const { consent, open } = useSyncExternalStore(subscribe, getSnapshot, () => SERVER)
  if (!analyticsConfigured || consent === "unknown") return null
  const showBanner = consent === null || open

  return (
    <>
      {analyticsAllowed(consent) && (
        <>
          <Script id="ga4-consent" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});gtag('consent','update',{analytics_storage:'granted'});gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}
      {showBanner && (
        <section
          role="region"
          aria-label="Cookie choice"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm"
        >
          <p>
            We&apos;d like to use Google Analytics to see which pages get used. It sets cookies only if you accept. The site works the same either way.{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
          </p>
          {open && consent !== null && <p className="text-xs text-muted-foreground">Your current choice: {consent === "granted" ? "accepted" : "declined"}.</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => choose("denied")} className="h-10 rounded-xl border border-border bg-background font-semibold hover:border-foreground/40">
              Decline
            </button>
            <button type="button" onClick={() => choose("granted")} className="h-10 rounded-xl border border-border bg-background font-semibold hover:border-foreground/40">
              Accept
            </button>
          </div>
        </section>
      )}
    </>
  )
}
