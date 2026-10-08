import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { absoluteUrl, siteConfig } from "@/lib/site-config"
import { isAdminHost, isAppHost } from "@/lib/hosts"

// The app host (dashboard, tools) and the admin host are private: nothing there should be indexed.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? ""
  if (isAppHost(host) || isAdminHost(host)) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/create", "/domains", "/logo", "/memes", "/social", "/content", "/editor/", "/preview/", "/go/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  }
}
