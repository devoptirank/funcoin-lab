import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { MemeConcept, SavedDomain, SavedProject, SiteConfig } from "@/lib/types"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { kebab } from "@/lib/generator/text"
import { sanitizeDeep } from "@/lib/safety"

/**
 * Everything a wallet creates: projects (brand + website), saved domains, generation history,
 * bookmarks and generated images. Every query is scoped to the caller's account id.
 */

export class DataUnavailableError extends Error {
  constructor() {
    super("Storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  }
}

function db(): SupabaseClient {
  const sb = getSupabaseAdmin()
  if (!sb) throw new DataUnavailableError()
  return sb
}

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code })
  return res.data
}

// ---------------- Projects ----------------

type ProjectRow = { id: string; concept: MemeConcept; site: SiteConfig | null; slug: string; published: boolean; created_at: string; updated_at: string }
const PROJECT_COLS = "id, concept, site, slug, published, created_at, updated_at"

const toProject = (r: ProjectRow): SavedProject => ({
  id: r.id,
  concept: r.concept,
  site: r.site,
  slug: r.slug,
  published: r.published,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export async function listProjects(account: string): Promise<SavedProject[]> {
  const rows = check(await db().from("projects").select(PROJECT_COLS).eq("account_id", account).order("updated_at", { ascending: false }).limit(200))
  return (rows as ProjectRow[]).map(toProject)
}

export async function getProject(account: string, id: string): Promise<SavedProject | null> {
  const row = check(await db().from("projects").select(PROJECT_COLS).eq("account_id", account).eq("id", id).maybeSingle())
  return row ? toProject(row as ProjectRow) : null
}

export async function saveProject(account: string, project: Pick<SavedProject, "id" | "concept" | "site" | "slug">): Promise<SavedProject> {
  const sb = db()
  const existing = check(await sb.from("projects").select("account_id, slug").eq("id", project.id).maybeSingle()) as { account_id: string; slug: string } | null
  if (existing && existing.account_id !== account) throw Object.assign(new Error("Project not found"), { status: 404 })
  const concept = sanitizeDeep(project.concept)
  const site = project.site ? sanitizeDeep(project.site) : null
  let slug = existing?.slug ?? (/^[a-z0-9-]{2,64}$/.test(project.slug) ? project.slug : `${kebab(concept.name, 40) || "meme"}-${project.id.slice(-4).toLowerCase()}`)
  for (let attempt = 0; ; attempt++) {
    const res = await sb
      .from("projects")
      .upsert({ id: project.id, account_id: account, name: concept.name.slice(0, 80), concept, site, slug }, { onConflict: "id" })
      .select(PROJECT_COLS)
      .single()
    if (!res.error) return toProject(res.data as ProjectRow)
    // Slug taken by another project: add a random suffix and retry.
    if (res.error.code === "23505" && attempt < 3) slug = `${kebab(concept.name, 40) || "meme"}-${Math.random().toString(36).slice(2, 6)}`
    else throw new Error(res.error.message)
  }
}

export async function deleteProject(account: string, id: string) {
  check(await db().from("projects").delete().eq("account_id", account).eq("id", id))
}

export async function setPublished(account: string, id: string, published: boolean): Promise<SavedProject | null> {
  const row = check(
    await db()
      .from("projects")
      .update({ published, published_at: published ? new Date().toISOString() : null })
      .eq("account_id", account)
      .eq("id", id)
      .select(PROJECT_COLS)
      .maybeSingle(),
  )
  return row ? toProject(row as ProjectRow) : null
}

/**
 * Public: a published site by slug, or null. Hidden or removed sites (moderation) and sites whose
 * owner is banned are never served.
 */
export async function getPublishedSite(slug: string): Promise<SiteConfig | null> {
  const sb = getSupabaseAdmin()
  if (!sb || !/^[a-z0-9-]{2,64}$/.test(slug)) return null
  const { data } = await sb
    .from("projects")
    .select("site, account_id")
    .eq("slug", slug)
    .eq("published", true)
    .eq("moderation_status", "ok")
    .maybeSingle()
  if (!data?.site) return null
  const { data: owner, error } = await sb.from("billing_accounts").select("status").eq("id", data.account_id).maybeSingle()
  if (error || owner?.status === "banned") return null
  return data.site as SiteConfig
}

// ---------------- Saved domains ----------------

export async function listDomains(account: string): Promise<SavedDomain[]> {
  const rows = check(await db().from("saved_domains").select("domain, topic, status, created_at").eq("account_id", account).order("created_at", { ascending: false }).limit(500))
  return (rows as { domain: string; topic: string; status: SavedDomain["status"]; created_at: string }[]).map((r) => ({ domain: r.domain, topic: r.topic, status: r.status, savedAt: r.created_at }))
}

export async function saveDomain(account: string, d: Pick<SavedDomain, "domain" | "topic" | "status">) {
  check(await db().from("saved_domains").upsert({ account_id: account, domain: d.domain, topic: d.topic, status: d.status }, { onConflict: "account_id,domain" }))
}

export async function removeDomain(account: string, domain: string) {
  check(await db().from("saved_domains").delete().eq("account_id", account).eq("domain", domain))
}

// ---------------- Activity, stats, bookmarks ----------------

export type ActivityKind = "idea" | "meme" | "bios" | "content"

export async function recordActivity(account: string, kind: ActivityKind, input: unknown, output: unknown) {
  check(await db().from("activity").insert({ account_id: account, kind, input: input ?? {}, output: output ?? {} }))
}

export async function stats(account: string) {
  const sb = db()
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const { count: n, error } = await q
    if (error) throw new Error(error.message)
    return n ?? 0
  }
  const [ideas, brands, websites, domains] = await Promise.all([
    count(sb.from("activity").select("id", { count: "exact", head: true }).eq("account_id", account).eq("kind", "idea")),
    count(sb.from("projects").select("id", { count: "exact", head: true }).eq("account_id", account)),
    count(sb.from("projects").select("id", { count: "exact", head: true }).eq("account_id", account).not("site", "is", null)),
    count(sb.from("saved_domains").select("domain", { count: "exact", head: true }).eq("account_id", account)),
  ])
  return { ideas: Math.max(ideas, brands), brands, websites, domains }
}

export async function listBookmarks(account: string): Promise<string[]> {
  const rows = check(await db().from("bookmarks").select("ref").eq("account_id", account).order("created_at", { ascending: false }))
  return (rows as { ref: string }[]).map((r) => r.ref)
}

export async function isBookmarked(account: string, ref: string): Promise<boolean> {
  const row = check(await db().from("bookmarks").select("ref").eq("account_id", account).eq("ref", ref).maybeSingle())
  return Boolean(row)
}

export async function toggleBookmark(account: string, ref: string, data: unknown): Promise<boolean> {
  const sb = db()
  const existing = check(await sb.from("bookmarks").select("ref").eq("account_id", account).eq("ref", ref).maybeSingle())
  if (existing) {
    check(await sb.from("bookmarks").delete().eq("account_id", account).eq("ref", ref))
    return false
  }
  check(await sb.from("bookmarks").insert({ account_id: account, ref, data: data ?? {} }))
  return true
}

// ---------------- Generated images ----------------

export type AssetType = "logo" | "mascot" | "meme" | "banner" | "site-hero"
export type AssetRecord = { id: string; conceptId: string; type: AssetType; pose: string | null; mime: string; url: string; ref: string; createdAt: string }

type AssetRow = { id: string; concept_id: string; type: AssetType; pose: string | null; mime: string; storage_path: string; created_at: string }
const ASSET_COLS = "id, concept_id, type, pose, mime, storage_path, created_at"
const BUCKET = "generated"

function toAsset(sb: SupabaseClient, r: AssetRow): AssetRecord {
  const url = sb.storage.from(BUCKET).getPublicUrl(r.storage_path).data.publicUrl
  return { id: r.id, conceptId: r.concept_id, type: r.type, pose: r.pose, mime: r.mime, url, ref: url, createdAt: r.created_at }
}

export async function listAssets(account: string, conceptId: string): Promise<AssetRecord[]> {
  const sb = db()
  const rows = check(await sb.from("generated_assets").select(ASSET_COLS).eq("account_id", account).eq("concept_id", conceptId).neq("moderation_status", "removed").order("created_at", { ascending: false }).limit(200))
  return (rows as AssetRow[]).map((r) => toAsset(sb, r))
}

export async function saveAsset(
  account: string,
  input: { conceptId: string; type: AssetType; pose: string | null; bytes: Uint8Array; mime: string; prompt: string; model: string },
): Promise<AssetRecord> {
  const sb = db()
  const folder = account.replace(/[^a-zA-Z0-9]/g, "_")
  const concept = input.conceptId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "misc"
  const ext = input.mime.split("/")[1] || "webp"
  const path = `${folder}/${concept}/${input.type}/${crypto.randomUUID()}.${ext}`
  const up = await sb.storage.from(BUCKET).upload(path, input.bytes, { contentType: input.mime, upsert: false, cacheControl: "31536000" })
  if (up.error) throw new Error(`Image upload failed: ${up.error.message}`)
  const row = check(
    await sb
      .from("generated_assets")
      .insert({ account_id: account, concept_id: concept, type: input.type, pose: input.pose, mime: input.mime, storage_path: path, prompt: input.prompt.slice(0, 4000), model: input.model })
      .select(ASSET_COLS)
      .single(),
  )
  return toAsset(sb, row as AssetRow)
}

export async function removeAsset(account: string, id: string) {
  const sb = db()
  const row = check(await sb.from("generated_assets").select("storage_path").eq("account_id", account).eq("id", id).maybeSingle()) as { storage_path: string } | null
  if (!row) return
  await sb.storage.from(BUCKET).remove([row.storage_path])
  check(await sb.from("generated_assets").delete().eq("account_id", account).eq("id", id))
}

// ---------------- Clicks ----------------

export async function logDomainClick(domain: string, source: string, account: string | null) {
  const sb = getSupabaseAdmin()
  if (!sb) return console.info(`[domain-click] ${domain} (${source})`)
  const { error } = await sb.from("domain_clicks").insert({ domain, source, account_id: account })
  if (error) console.error("[domain-click] log failed:", error.message)
}
