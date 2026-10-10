/**
 * Analytics consent. Google Analytics is optional (NEXT_PUBLIC_GA_ID, blank = off, no banner) and
 * loads only after the visitor accepts. The choice is remembered in a first-party cookie shared by
 * the marketing site and the app, so people are asked once.
 */

export const CONSENT_COOKIE = "fcl_consent"
export type Consent = "granted" | "denied"

const SIX_MONTHS = 60 * 60 * 24 * 180

/** The one switch: no ID means no analytics and no banner. Production builds only. */
export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? "").trim()
export const analyticsConfigured = /^G-[A-Z0-9]{4,}$/.test(GA_ID) && process.env.NODE_ENV === "production"

/** The saved choice in a Cookie header or document.cookie string, or null when none was made. */
export function readConsent(cookieHeader: string | null | undefined): Consent | null {
  const m = (cookieHeader ?? "").match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(granted|denied)(?:;|$)`))
  return m ? (m[1] as Consent) : null
}

/** Analytics may load only when it is configured and the visitor has said yes. */
export const analyticsAllowed = (consent: Consent | null) => analyticsConfigured && consent === "granted"

/** A `document.cookie` assignment that saves the choice for six months. */
export function consentCookie(value: Consent, opts: { domain?: string; secure?: boolean } = {}): string {
  return [`${CONSENT_COOKIE}=${value}`, "Path=/", `Max-Age=${SIX_MONTHS}`, "SameSite=Lax", opts.domain ? `Domain=${opts.domain}` : "", opts.secure ? "Secure" : ""].filter(Boolean).join("; ")
}
