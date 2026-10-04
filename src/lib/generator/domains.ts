import { SUFFIXES } from "./banks"
import { slugify } from "./text"

const PREFIXES = ["the", "its", "just", "my", "team", "hey", "real", "only"]

/**
 * Generate .fun domain *ideas* for a topic. These are suggestions only —
 * availability is never implied here (see lib/domains for registrar checks).
 */
export function generateDomainIdeas(topic: string, max = 16): string[] {
  const words = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 4)
  const base = slugify(words.join("")) || "meme"
  const out = new Set<string>()

  for (const suffix of SUFFIXES.domain) out.add(`${base}${suffix}`)
  if (words.length > 1) {
    out.add(words.join("-"))
    out.add(words.map((w) => w[0]).join("") + words[words.length - 1])
    out.add(words[words.length - 1] + words.slice(0, -1).join(""))
  }
  for (const prefix of PREFIXES) out.add(`${prefix}${base}`)

  return [...out]
    .filter((label) => label.length >= 2 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-"))
    .slice(0, max)
    .map((label) => `${label}.fun`)
}

export function isValidFunDomain(domain: string): boolean {
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)\.fun$/.test(domain)
}
