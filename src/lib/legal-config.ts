/**
 * Owner details the legal pages need. All from env, all optional: where a value is blank the page
 * leaves that sentence or section out. Nothing here is ever invented or shown as a placeholder.
 *
 * These are decisions for the owner and their lawyer (who operates the site, which law applies,
 * where the service is not offered). The code only displays and enforces what they set.
 */

const env = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim()
const email = (v: string | undefined) => {
  const e = env(v)
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : ""
}

const DEFAULT_MIN_AGE = 18
const minAge = (v: string | undefined) => {
  const n = Number.parseInt(env(v), 10)
  return Number.isInteger(n) && n >= 13 && n <= 25 ? n : DEFAULT_MIN_AGE
}

// NEXT_PUBLIC_ values are read by name so Next.js can inline them in the browser bundle too.
export const LEGAL = {
  /** The person or company that operates the site. */
  entity: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY),
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
  country: env(process.env.NEXT_PUBLIC_LEGAL_COUNTRY),
  governingLaw: env(process.env.NEXT_PUBLIC_GOVERNING_LAW),
  disputeVenue: env(process.env.NEXT_PUBLIC_DISPUTE_VENUE),
  privacyEmail: email(process.env.NEXT_PUBLIC_PRIVACY_EMAIL),
  copyrightEmail: email(process.env.NEXT_PUBLIC_COPYRIGHT_EMAIL),
  minAge: minAge(process.env.NEXT_PUBLIC_MIN_AGE),
}

/**
 * ISO 3166-1 alpha-2 country codes where the service is not offered, from the server-only
 * RESTRICTED_COUNTRIES (comma-separated). Empty by default and always empty in the browser.
 */
export function restrictedCountries(): string[] {
  return env(process.env.RESTRICTED_COUNTRIES)
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
}

export const isRestrictedCountry = (code: string | null | undefined) => Boolean(code) && restrictedCountries().includes(code!.trim().toUpperCase())
