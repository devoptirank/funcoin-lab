import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { str } from "@/lib/admin/api"

/**
 * Queries behind /admin/content (sites, images, reports), shared by the page and the CSV export so
 * both always use the same filters. Every list is one indexed, paginated query plus at most one
 * batched lookup for related rows (no N+1).
 */

type SP = Record<string, string | string[] | undefined>

export const CONTENT_TABS = ["sites", "images", "reports"] as const
export type ContentTab = (typeof CONTENT_TABS)[number]
export const tabOf = (sp: SP): ContentTab => {
  const t = str(sp.tab)
  return (CONTENT_TABS as readonly string[]).includes(t) ? (t as ContentTab) : "sites"
}

const BUCKET = "generated"
export const ASSET_TYPES = ["logo", "mascot", "meme", "banner", "site-hero"] as const

/** Search text safe to embed in a PostgREST filter string. */
const searchText = (v: string) => v.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, " ").trim().slice(0, 64)
const dateOnly = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "")
/** Accepts "sol:<address>" or a bare address. */
export const accountOf = (v: string) => {
  const t = v.trim()
  if (!t) return ""
  if (!/^(sol:)?[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return ""
  return t.startsWith("sol:") ? t : `sol:${t}`
}

/** Public URL of a published site, on the marketing host when it's configured. */
export function siteUrl(slug: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  return `${base}/site/${slug}`
}

// ---------------- Sites ----------------

export type SiteFilters = { status: "all" | "live" | "hidden" | "removed"; featured: "any" | "yes" | "no"; q: string }
export const siteFilters = (sp: SP): SiteFilters => {
  const status = str(sp.status)
  const featured = str(sp.featured)
  return {
    status: (["live", "hidden", "removed"].includes(status) ? status : "all") as SiteFilters["status"],
    featured: (["yes", "no"].includes(featured) ? featured : "any") as SiteFilters["featured"],
    q: searchText(str(sp.q)),
  }
}

export type SiteRow = {
  id: string
  name: string
  slug: string
  account_id: string
  published: boolean
  published_at: string | null
  updated_at: string
  moderation_status: "ok" | "hidden" | "removed"
  moderation_reason: string | null
  featured: boolean
  mascot: string | null
  mascot_image: string | null
  ticker: string | null
}

const SITE_COLS =
  "id, name, slug, account_id, published, published_at, updated_at, moderation_status, moderation_reason, featured, mascot:concept->>mascot, mascot_image:site->brand->>mascotImage, ticker:concept->>ticker"

export async function listSites(sb: SupabaseClient, f: SiteFilters, from: number, to: number) {
  let q = sb.from("projects").select(SITE_COLS)
  const search = f.q ? [`slug.ilike."*${f.q}*"`, `name.ilike."*${f.q}*"`] : null
  if (f.status === "live") q = q.eq("published", true).eq("moderation_status", "ok")
  else if (f.status === "hidden" || f.status === "removed") q = q.eq("moderation_status", f.status)
  if (f.status === "all") {
    // Published sites plus anything moderated, combined with the optional search in one OR.
    const scopes = ["published.eq.true", "moderation_status.neq.ok"]
    q = q.or(search ? scopes.flatMap((s) => search.map((t) => `and(${s},${t})`)).join(",") : scopes.join(","))
  } else if (search) {
    q = q.or(search.join(","))
  }
  if (f.featured !== "any") q = q.eq("featured", f.featured === "yes")
  const { data, error } = await q.order("updated_at", { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SiteRow[]
}

/** Open report counts for a page of targets, in one query. */
export async function openReportCounts(sb: SupabaseClient, type: "site" | "asset", ids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (!ids.length) return counts
  const { data } = await sb.from("content_reports").select("target_id").eq("target_type", type).eq("status", "open").in("target_id", ids).limit(5000)
  for (const r of (data ?? []) as { target_id: string }[]) counts.set(r.target_id, (counts.get(r.target_id) ?? 0) + 1)
  return counts
}

/** Thumbnail for a site: the AI mascot image when it's a real https URL, else the concept mascot. */
export const siteThumb = (r: Pick<SiteRow, "mascot" | "mascot_image">) => (r.mascot_image?.startsWith("https://") ? r.mascot_image : r.mascot || "")

// ---------------- Images ----------------

export type ImageFilters = { type: string; from: string; to: string; owner: string; status: "ok" | "hidden" | "removed" | "all" }
export const imageFilters = (sp: SP): ImageFilters => {
  const type = str(sp.type)
  const status = str(sp.status)
  return {
    type: (ASSET_TYPES as readonly string[]).includes(type) ? type : "",
    from: dateOnly(str(sp.from)),
    to: dateOnly(str(sp.to)),
    owner: accountOf(str(sp.owner)),
    status: (["hidden", "removed", "all"].includes(status) ? status : "ok") as ImageFilters["status"],
  }
}

export type ImageRow = { id: string; account_id: string; concept_id: string; type: string; created_at: string; storage_path: string; moderation_status: string; moderation_reason: string | null; url: string }

export async function listImages(sb: SupabaseClient, f: ImageFilters, from: number, to: number): Promise<ImageRow[]> {
  let q = sb.from("generated_assets").select("id, account_id, concept_id, type, created_at, storage_path, moderation_status, moderation_reason")
  if (f.type) q = q.eq("type", f.type)
  if (f.owner) q = q.eq("account_id", f.owner)
  if (f.status !== "all") q = q.eq("moderation_status", f.status)
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00Z`)
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59.999Z`)
  const { data, error } = await q.order("created_at", { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Omit<ImageRow, "url">[]).map((r) => ({ ...r, url: sb.storage.from(BUCKET).getPublicUrl(r.storage_path).data.publicUrl }))
}

// ---------------- Reports ----------------

export type ReportFilters = { status: "open" | "actioned" | "dismissed" | "all"; type: "" | "site" | "asset" }
export const reportFilters = (sp: SP): ReportFilters => {
  const status = str(sp.status)
  const type = str(sp.type)
  return {
    status: (["actioned", "dismissed", "all"].includes(status) ? status : "open") as ReportFilters["status"],
    type: (type === "site" || type === "asset" ? type : "") as ReportFilters["type"],
  }
}

export type ReportRow = {
  id: string
  target_type: "site" | "asset"
  target_id: string
  reason: string
  reporter_account: string | null
  status: "open" | "actioned" | "dismissed"
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
}

export type ReportTarget =
  | { kind: "site"; id: string; name: string; slug: string; owner: string; thumb: string; moderation: string; published: boolean }
  | { kind: "asset"; id: string; type: string; owner: string; url: string; moderation: string }

export async function listReports(sb: SupabaseClient, f: ReportFilters, from: number, to: number) {
  let q = sb.from("content_reports").select("id, target_type, target_id, reason, reporter_account, status, created_at, resolved_by, resolved_at")
  if (f.status !== "all") q = q.eq("status", f.status)
  if (f.type) q = q.eq("target_type", f.type)
  // Open reports (not yet resolved) first, newest first within each group.
  const { data, error } = await q.order("resolved_at", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return (data ?? []) as ReportRow[]
}

/** Context for a page of reports: one query for sites, one for images. */
export async function reportTargets(sb: SupabaseClient, rows: ReportRow[]): Promise<Map<string, ReportTarget>> {
  const out = new Map<string, ReportTarget>()
  const siteIds = [...new Set(rows.filter((r) => r.target_type === "site").map((r) => r.target_id))]
  const assetIds = [...new Set(rows.filter((r) => r.target_type === "asset").map((r) => r.target_id))].filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  const [sites, assets] = await Promise.all([
    siteIds.length ? sb.from("projects").select(SITE_COLS).in("id", siteIds) : Promise.resolve({ data: [] }),
    assetIds.length ? sb.from("generated_assets").select("id, account_id, type, storage_path, moderation_status").in("id", assetIds) : Promise.resolve({ data: [] }),
  ])
  for (const s of ((sites.data ?? []) as unknown as SiteRow[])) {
    out.set(`site:${s.id}`, { kind: "site", id: s.id, name: s.name, slug: s.slug, owner: s.account_id, thumb: siteThumb(s), moderation: s.moderation_status, published: s.published })
  }
  for (const a of (assets.data ?? []) as { id: string; account_id: string; type: string; storage_path: string; moderation_status: string }[]) {
    out.set(`asset:${a.id}`, { kind: "asset", id: a.id, type: a.type, owner: a.account_id, url: sb.storage.from(BUCKET).getPublicUrl(a.storage_path).data.publicUrl, moderation: a.moderation_status })
  }
  return out
}
