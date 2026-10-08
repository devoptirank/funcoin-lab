// Guardrails applied to every generated string (AI or local) before it reaches the UI.
// FunCoin Lab generates creative branding, never financial promises.
// Client-safe: no server imports here. Admin-added blocked terms are merged in by src/lib/safety-server.ts.

const REPLACEMENTS: [RegExp, string][] = [
  [/\b(?:to|till|until) the moon\b/gi, "to the meme-iverse"],
  [/\bmoon(?:ing|shot)s?\b/gi, "going viral"],
  [/\b\d{1,5}\s?x(?:\s?(?:gains?|returns?|potential))?\b(?![a-z])/gi, "100% vibes"],
  [/\bguaranteed?\b/gi, "probably"],
  [/\bget(?:ting)? rich\b/gi, "get silly"],
  [/\b(?:financial freedom|passive income|easy money)\b/gi, "good vibes"],
  [/\b(?:profits?|gains|returns on investment|roi)\b/gi, "good vibes"],
  [/\binvest(?:ing|ment|ments|ors?)?\b/gi, "join in"],
  [/\bbuy (?:now|the dip|early)\b/gi, "join the fun"],
  [/\b(?:pump(?:ing|ed)?|dump(?:ing|ed)?)\b/gi, "party"],
  [/\bmarket ?cap\b/gi, "meme power"],
  [/\bprice (?:prediction|target|will|is going)\b/gi, "vibe check"],
  [/\bnot financial advice\b/gi, "just memes"],
  [/\b(?:lambo|wagmi|hodl)\b/gi, "vibes"],
]

// Links and wallet/contract addresses are data, not copy: rewriting them ("pump.fun" -> "party.fun")
// would break them or point somewhere else.
const URL_ONLY = /^https?:\/\/\S+$/i
const ADDRESS_ONLY = /^(?:[1-9A-HJ-NP-Za-km-z]{32,44}|0x[0-9a-fA-F]{40})$/

export function sanitizeText(input: string): string {
  if (URL_ONLY.test(input.trim()) || ADDRESS_ONLY.test(input.trim())) return input.trim()
  let out = input
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement)
  // House style: no emojis and no em/en dashes in generated copy.
  out = out.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/ {2,}/g, " ")
  out = out.replace(/\s*[\u2014\u2013]\s*/g, " - ")
  return out.replace(/\s{3,}/g, "  ").trim()
}

/** Recursively sanitize every string in a JSON-like value. */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") return sanitizeText(value) as T
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v)) as T
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeDeep(v)
    return out as T
  }
  return value
}

/** The built-in financial-promise rewrites, for read-only display (pattern source and replacement). */
export const SAFETY_REPLACEMENTS: readonly { pattern: string; flags: string; replacement: string }[] = REPLACEMENTS.map(([re, replacement]) => ({
  pattern: re.source,
  flags: re.flags,
  replacement,
}))

// Topics we won't build meme brands around. Deliberately short: the AI provider's own
// safety systems handle nuance; this catches the obvious cases in local mode too.
// These are the floor: admins can add terms on top, never remove these.
export const BUILT_IN_BLOCKED_TERMS: readonly string[] = [
  "nazi",
  "hitler",
  "terrorism",
  "terrorist",
  "isis",
  "genocide",
  "rape",
  "porn",
  "nsfw",
  "child abuse",
  "suicide",
  "kkk",
  "slur",
]

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const termsRegex = (terms: readonly string[]) => new RegExp(`\\b(?:${terms.map((t) => escapeRe(t).replace(/\s+/g, "\\s+")).join("|")})\\b`, "i")

const BLOCKED_TOPIC = termsRegex(BUILT_IN_BLOCKED_TERMS)

/** Admin-added terms: lowercase, 2 to 40 characters, letters, digits, spaces and hyphens. */
export const SAFETY_TERM_PATTERN = /^[a-z0-9][a-z0-9 -]{0,38}[a-z0-9]$/

/** Normalize a term an admin typed: trim, lowercase, collapse spaces. Returns null if invalid. */
export function normalizeSafetyTerm(input: string): string | null {
  const t = input.trim().toLowerCase().replace(/\s+/g, " ")
  return SAFETY_TERM_PATTERN.test(t) ? t : null
}

/** Which blocked term (built-in or extra) the text hits, or null. */
export function matchBlockedTerm(text: string, extraTerms: readonly string[] = []): string | null {
  const built = text.match(BLOCKED_TOPIC)
  if (built) return built[0].toLowerCase()
  const extra = extraTerms.map(normalizeSafetyTerm).filter((t): t is string => Boolean(t))
  if (!extra.length) return null
  const hit = text.match(termsRegex(extra))
  return hit ? hit[0].toLowerCase() : null
}

export function checkTopic(topic: string, extraTerms: readonly string[] = []): { ok: true } | { ok: false; reason: string } {
  if (matchBlockedTerm(topic, extraTerms)) {
    return { ok: false, reason: "Let's keep it fun. Try a different meme topic." }
  }
  return { ok: true }
}

export const CONCEPT_DISCLAIMER =
  "Not financial advice. Crypto assets are risky: do your own research and follow the rules where you launch."

/** Reasons offered by the public Report link on published sites (stored on content_reports.reason). */
export const REPORT_REASONS = [
  { id: "scam", label: "Scam or fraud" },
  { id: "financial-promise", label: "Promises profits or price gains" },
  { id: "hate", label: "Hateful or harmful" },
  { id: "sexual", label: "Sexual content" },
  { id: "impersonation", label: "Impersonation or copyright" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Something else" },
] as const

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"]
