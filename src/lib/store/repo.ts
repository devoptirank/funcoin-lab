"use client"
import type { MemeConcept, SavedDomain, SavedProject, SiteConfig } from "@/lib/types"
import { kebab } from "@/lib/generator/text"

export type Stats = { ideas: number; brands: number; websites: number; domains: number }
export type GenerationKind = "meme" | "bios" | "content"

/** Persistence for everything a wallet creates. Stored on the server, scoped to the signed-in wallet. */
export interface Repo {
  listProjects(): Promise<SavedProject[]>
  getProject(id: string): Promise<SavedProject | null>
  saveProject(project: SavedProject): Promise<SavedProject>
  deleteProject(id: string): Promise<void>
  setPublished(id: string, published: boolean): Promise<SavedProject>
  listDomains(): Promise<SavedDomain[]>
  saveDomain(domain: SavedDomain): Promise<void>
  removeDomain(domain: string): Promise<void>
  recordIdea(concept: MemeConcept): Promise<void>
  recordGeneration(kind: GenerationKind, input: unknown, output: unknown): Promise<void>
  stats(): Promise<Stats>
  listBookmarks(): Promise<string[]>
  toggleBookmark(ref: string, data?: unknown): Promise<boolean>
}

export function newProject(concept: MemeConcept, site: SiteConfig | null): SavedProject {
  const now = new Date().toISOString()
  return {
    id: concept.id,
    concept,
    site,
    slug: `${kebab(concept.name) || "meme"}-${concept.id.slice(-4).toLowerCase()}`,
    published: false,
    createdAt: now,
    updatedAt: now,
  }
}

export class AuthRequiredError extends Error {}

async function call<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const res = await fetch(`/api/me/${path}`, {
    method,
    headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: "no-store",
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (res.status === 401) throw new AuthRequiredError(json.error || "Connect your wallet first.")
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json
}

const changed = () => window.dispatchEvent(new Event("fcl:store"))

export const apiRepo: Repo = {
  listProjects: () => call("GET", "projects"),
  async getProject(id) {
    try {
      return await call<SavedProject>("GET", `projects/${encodeURIComponent(id)}`)
    } catch (e) {
      if (e instanceof Error && /not found/i.test(e.message)) return null
      throw e
    }
  },
  async saveProject(p) {
    const saved = await call<SavedProject>("POST", "projects", { id: p.id, slug: p.slug, concept: p.concept, site: p.site })
    changed()
    return saved
  },
  async deleteProject(id) {
    await call("DELETE", `projects/${encodeURIComponent(id)}`)
    changed()
  },
  async setPublished(id, published) {
    const p = await call<SavedProject>("PATCH", `projects/${encodeURIComponent(id)}`, { published })
    changed()
    return p
  },
  listDomains: () => call("GET", "domains"),
  async saveDomain(d) {
    await call("POST", "domains", { domain: d.domain, topic: d.topic, status: d.status })
    changed()
  },
  async removeDomain(domain) {
    await call("DELETE", `domains?domain=${encodeURIComponent(domain)}`)
    changed()
  },
  async recordIdea(concept) {
    await call("POST", "activity", { kind: "idea", input: concept.input, output: { id: concept.id, name: concept.name, ticker: concept.ticker, domain: concept.domain } })
  },
  async recordGeneration(kind, input, output) {
    await call("POST", "activity", { kind, input, output })
  },
  stats: () => call("GET", "stats"),
  listBookmarks: () => call("GET", "bookmarks"),
  async toggleBookmark(ref, data) {
    const { on } = await call<{ on: boolean }>("POST", "bookmarks", { ref, data })
    return on
  },
}
