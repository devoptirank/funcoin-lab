// Guardrails applied to every generated string (AI or local) before it reaches the UI.
// FunCoin Lab generates creative branding — never financial promises.

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

export function sanitizeText(input: string): string {
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

// Topics we won't build meme brands around. Deliberately short: the AI provider's own
// safety systems handle nuance; this catches the obvious cases in local mode too.
const BLOCKED_TOPIC = /\b(nazi|hitler|terroris[mt]|isis|genocide|rape|porn|nsfw|child abuse|suicide|kkk|slur)\b/i

export function checkTopic(topic: string): { ok: true } | { ok: false; reason: string } {
  if (BLOCKED_TOPIC.test(topic)) {
    return { ok: false, reason: "Let's keep it fun. Try a different meme topic." }
  }
  return { ok: true }
}

export const CONCEPT_DISCLAIMER =
  "Not financial advice. Crypto assets are risky: do your own research and follow the rules where you launch."
