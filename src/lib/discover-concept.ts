import type { MemeConcept } from "@/lib/types"
import type { DiscoverProject } from "@/lib/discover"
import { generateConceptLocal } from "@/lib/generator/concept"

const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/**
 * A full brand concept for a Discover idea: lore, slogans, memes and site copy from the local
 * generator (deterministic per slug), with the curated name, ticker, domain and art swapped in.
 */
export function conceptForProject(p: DiscoverProject): MemeConcept {
  const c = generateConceptLocal({ ...p.remix, seed: seedOf(p.slug) })
  const swap = (text: string) =>
    text.split(`$${c.ticker}`).join(`$${p.ticker}`).split(c.domain).join(p.domain).split(c.name).join(p.name)
  const out = JSON.parse(JSON.stringify(c), (_k, v) => (typeof v === "string" ? swap(v) : v)) as MemeConcept
  return {
    ...out,
    id: `discover_${p.slug}`,
    name: p.name,
    ticker: p.ticker,
    domain: p.domain,
    tagline: p.description,
    mascot: p.mascot,
    traits: p.personality,
    palette: p.colors.map((hex, i) => ({ name: out.palette[i]?.name ?? `Color ${i + 1}`, hex })),
  }
}
