import type { MetadataRoute } from "next"
import { seoPages } from "@/content/seo-pages"
import { absoluteUrl } from "@/lib/site-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const core = ["/", "/discover", "/about", "/pricing"]
  const legal = ["/terms", "/privacy", "/disclaimer", "/affiliate-disclosure"]
  return [
    ...core.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.8 })),
    ...seoPages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...legal.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ]
}
