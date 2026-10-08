import type { MetadataRoute } from "next"
import { seoPages } from "@/content/seo-pages"
import { DISCOVER_PROJECTS } from "@/lib/discover"
import { absoluteUrl } from "@/lib/site-config"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const revalidate = 3600

/** Published meme sites, so search engines can find what people build. */
async function publishedSites(): Promise<MetadataRoute.Sitemap> {
  const sb = getSupabaseAdmin()
  if (!sb) return []
  const { data } = await sb.from("projects").select("slug, updated_at").eq("published", true).order("updated_at", { ascending: false }).limit(5000)
  return (data ?? []).map((r: { slug: string; updated_at: string }) => ({
    url: absoluteUrl(`/site/${r.slug}`),
    lastModified: new Date(r.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const core = ["/", "/discover", "/pricing", "/token", "/about", "/contact"]
  const legal = ["/terms", "/privacy", "/disclaimer", "/affiliate-disclosure"]
  return [
    ...core.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.8 })),
    ...seoPages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...DISCOVER_PROJECTS.map((p) => ({ url: absoluteUrl(`/discover/${p.slug}`), lastModified: new Date(p.addedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...legal.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
    ...(await publishedSites().catch(() => [])),
  ]
}
