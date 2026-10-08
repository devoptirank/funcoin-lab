import type { Metadata } from "next"
import { siteConfig } from "./site-config"

/**
 * The social preview image (src/app/opengraph-image.tsx). Pages that set their own `openGraph`
 * replace the inherited one, image included, so every page lists it explicitly.
 */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name}: ${siteConfig.tagline}`, type: "image/png" }

/** Consistent per-page metadata: unique title/description, canonical URL and Open Graph. */
export function pageMetadata({ title, description, path, noindex }: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  return {
    title: { absolute: title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}` },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: siteConfig.name, type: "website", locale: "en_US", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    robots: noindex ? { index: false, follow: false } : undefined,
  }
}
