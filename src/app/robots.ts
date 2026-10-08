import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/create", "/domains", "/logo", "/memes", "/social", "/content", "/editor/", "/preview/", "/go/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
