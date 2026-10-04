"use client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { MemeConcept, SavedDomain, SavedProject, SiteConfig } from "@/lib/types"
import { kebab } from "@/lib/generator/text"

export type Stats = { ideas: number; brands: number; websites: number; domains: number }
export type GenerationKind = "meme" | "bios" | "content"

/** Persistence for everything a user creates. Guest mode → localStorage, signed in → Supabase. */
export interface Repo {
  readonly kind: "local" | "cloud"
  listProjects(): Promise<SavedProject[]>
  getProject(id: string): Promise<SavedProject | null>
  saveProject(project: SavedProject): Promise<SavedProject>
  deleteProject(id: string): Promise<void>
  setPublished(id: string, published: boolean): Promise<SavedProject>
  listDomains(): Promise<SavedDomain[]>
  saveDomain(domain: SavedDomain): Promise<void>
  removeDomain(domain: string): Promise<void>
  recordIdea(concept: MemeConcept): Promise<void>
  recordGeneration(kind: GenerationKind, input: unknown, output: unknown, extra?: { platform?: string; contentType?: string }): Promise<void>
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
    slug: `${kebab(concept.name) || "meme"}-${concept.id.slice(-4)}`,
    published: false,
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------- localStorage ----------------

const KEYS = { projects: "fcl:projects", domains: "fcl:domains", ideas: "fcl:ideas-count", bookmarks: "fcl:bookmarks" }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event("fcl:store"))
  } catch {
    // Storage full or blocked (private mode). The UI still works for this session.
  }
}

export const localRepo: Repo = {
  kind: "local",
  async listProjects() {
    return read<SavedProject[]>(KEYS.projects, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async getProject(id) {
    return read<SavedProject[]>(KEYS.projects, []).find((p) => p.id === id) ?? null
  },
  async saveProject(project) {
    const all = read<SavedProject[]>(KEYS.projects, [])
    const next = { ...project, updatedAt: new Date().toISOString() }
    write(KEYS.projects, [next, ...all.filter((p) => p.id !== project.id)].slice(0, 100))
    return next
  },
  async deleteProject(id) {
    write(KEYS.projects, read<SavedProject[]>(KEYS.projects, []).filter((p) => p.id !== id))
  },
  async setPublished() {
    throw new Error("Sign in to publish your website. Guest projects live only in this browser.")
  },
  async listDomains() {
    return read<SavedDomain[]>(KEYS.domains, [])
  },
  async saveDomain(d) {
    write(KEYS.domains, [d, ...read<SavedDomain[]>(KEYS.domains, []).filter((x) => x.domain !== d.domain)].slice(0, 200))
  },
  async removeDomain(domain) {
    write(KEYS.domains, read<SavedDomain[]>(KEYS.domains, []).filter((x) => x.domain !== domain))
  },
  async recordIdea() {
    write(KEYS.ideas, read<number>(KEYS.ideas, 0) + 1)
  },
  async recordGeneration() {},
  async stats() {
    const projects = read<SavedProject[]>(KEYS.projects, [])
    return {
      ideas: Math.max(read<number>(KEYS.ideas, 0), projects.length),
      brands: projects.length,
      websites: projects.filter((p) => p.site).length,
      domains: read<SavedDomain[]>(KEYS.domains, []).length,
    }
  },
  async listBookmarks() {
    return read<string[]>(KEYS.bookmarks, [])
  },
  async toggleBookmark(ref) {
    const all = read<string[]>(KEYS.bookmarks, [])
    const on = !all.includes(ref)
    write(KEYS.bookmarks, on ? [ref, ...all] : all.filter((r) => r !== ref))
    return on
  },
}

// ---------------- Supabase ----------------

type SiteRow = { slug: string; config: SiteConfig; is_published: boolean }
type ProjectRow = {
  id: string
  status: string
  created_at: string
  updated_at: string
  brand_profiles: { data: MemeConcept } | { data: MemeConcept }[] | null
  website_projects: SiteRow | SiteRow[] | null
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)

function rowToProject(row: ProjectRow): SavedProject | null {
  const brand = one(row.brand_profiles)
  if (!brand) return null
  const site = one(row.website_projects)
  return {
    id: row.id,
    concept: brand.data,
    site: site?.config ?? null,
    slug: site?.slug ?? `${kebab(brand.data.name)}-${row.id.slice(-4)}`,
    published: site?.is_published ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PROJECT_SELECT = "id, status, created_at, updated_at, brand_profiles(data), website_projects(slug, config, is_published)"

export function createCloudRepo(sb: SupabaseClient, userId: string): Repo {
  const check = <T,>(res: { data: T; error: { message: string } | null }) => {
    if (res.error) throw new Error(res.error.message)
    return res.data
  }
  const count = async (table: string) => {
    const { count: n, error } = await sb.from(table).select("id", { count: "exact", head: true })
    if (error) throw new Error(error.message)
    return n ?? 0
  }

  const repo: Repo = {
    kind: "cloud",
    async listProjects() {
      const rows = check(await sb.from("projects").select(PROJECT_SELECT).order("updated_at", { ascending: false }).limit(100))
      return (rows as unknown as ProjectRow[]).map(rowToProject).filter((p): p is SavedProject => p !== null)
    },
    async getProject(id) {
      const row = check(await sb.from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle())
      return row ? rowToProject(row as unknown as ProjectRow) : null
    },
    async saveProject(project) {
      const c = project.concept
      check(
        await sb.from("projects").upsert({
          id: project.id,
          user_id: userId,
          name: c.name,
          ticker: c.ticker,
          domain: c.domain,
          status: project.published ? "published" : "draft",
          concept_input: c.input,
        }),
      )
      check(await sb.from("brand_profiles").upsert({ project_id: project.id, user_id: userId, data: c }, { onConflict: "project_id" }))
      let slug = project.slug
      if (project.site) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await sb
            .from("website_projects")
            .upsert(
              { project_id: project.id, user_id: userId, slug, config: project.site, is_published: project.published },
              { onConflict: "project_id" },
            )
          if (!res.error) break
          // Slug already used by another site: add a random suffix and retry.
          if (res.error.code === "23505" && attempt < 2) slug = `${kebab(c.name).slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`
          else throw new Error(res.error.message)
        }
      }
      return { ...project, slug, updatedAt: new Date().toISOString() }
    },
    async deleteProject(id) {
      check(await sb.from("projects").delete().eq("id", id))
    },
    async setPublished(id, published) {
      check(
        await sb
          .from("website_projects")
          .update({ is_published: published, published_at: published ? new Date().toISOString() : null })
          .eq("project_id", id),
      )
      check(await sb.from("projects").update({ status: published ? "published" : "draft" }).eq("id", id))
      const project = await repo.getProject(id)
      if (!project) throw new Error("Project not found")
      return project
    },
    async listDomains() {
      const rows = check(
        await sb.from("domain_ideas").select("domain, topic, status, created_at").eq("saved", true).order("created_at", { ascending: false }),
      ) as { domain: string; topic: string | null; status: SavedDomain["status"]; created_at: string }[]
      return rows.map((r) => ({ domain: r.domain, topic: r.topic ?? "", status: r.status, savedAt: r.created_at }))
    },
    async saveDomain(d) {
      check(
        await sb
          .from("domain_ideas")
          .upsert({ user_id: userId, domain: d.domain, topic: d.topic, status: d.status, saved: true }, { onConflict: "user_id,domain" }),
      )
    },
    async removeDomain(domain) {
      check(await sb.from("domain_ideas").delete().eq("domain", domain))
    },
    async recordIdea(concept) {
      check(await sb.from("meme_ideas").insert({ user_id: userId, input: concept.input, output: concept, source: concept.source }))
    },
    async recordGeneration(kind, input, output, extra) {
      if (kind === "meme") {
        check(await sb.from("meme_generations").insert({ user_id: userId, input, output }))
        return
      }
      check(
        await sb.from("social_generations").insert({
          user_id: userId,
          kind,
          platform: extra?.platform ?? null,
          content_type: extra?.contentType ?? null,
          input,
          output,
        }),
      )
    },
    async stats() {
      const [ideas, brands, websites, domains] = await Promise.all([
        count("meme_ideas"),
        count("brand_profiles"),
        count("website_projects"),
        count("domain_ideas"),
      ])
      return { ideas: Math.max(ideas, brands), brands, websites, domains }
    },
    async listBookmarks() {
      const rows = check(await sb.from("saved_projects").select("ref").eq("source", "discover")) as { ref: string }[]
      return rows.map((r) => r.ref)
    },
    async toggleBookmark(ref, data) {
      const existing = check(await sb.from("saved_projects").select("id").eq("source", "discover").eq("ref", ref).maybeSingle())
      if (existing) {
        check(await sb.from("saved_projects").delete().eq("source", "discover").eq("ref", ref))
        return false
      }
      check(await sb.from("saved_projects").insert({ user_id: userId, source: "discover", ref, data: data ?? {} }))
      return true
    },
  }
  return repo
}
