import type { NextConfig } from "next"

// The Supabase URL and anon key are public by design (row-level security protects data),
// so we accept the server-style names from .env and expose them to the browser here.
// Private keys (AI_API_KEY, IMAGE_API_KEY, DOMAIN_API_KEY) are never listed here.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    // Not secret: it's a public affiliate link template.
    NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE: process.env.NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE || process.env.DOMAIN_AFFILIATE_URL_TEMPLATE || "",
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
