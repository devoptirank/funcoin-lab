import type { Metadata } from "next"
import { siteConfig } from "./site-config"

/**
 * The social preview image (src/app/opengraph-image.tsx). Pages that set their own `openGraph`
 * replace the inherited one, image included, so every page lists it explicitly.
 */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name}: ${siteConfig.tagline}`, type: "image/png" }

/** Consistent per-page metadata: unique title/description, canonical URL and Open Graph. */
/** `fileImage`: the caller sets its own preview image, so leave images out. */
export function pageMetadata({ title, description, path, noindex, fileImage }: { title: string; description: string; path: string; noindex?: boolean; fileImage?: boolean }): Metadata {
  const images = fileImage ? undefined : [OG_IMAGE]
  return {
    title: { absolute: title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}` },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: siteConfig.name, type: "website", locale: "en_US", images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
    robots: noindex ? { index: false, follow: false } : undefined,
  }
}
