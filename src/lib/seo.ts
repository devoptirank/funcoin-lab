import type { Metadata } from "next"
import { siteConfig } from "./site-config"

/** Consistent per-page metadata: unique title/description, canonical URL and Open Graph. */
export function pageMetadata({ title, description, path, noindex }: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  return {
    title: { absolute: title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}` },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: siteConfig.name, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex ? { index: false, follow: false } : undefined,
  }
}
