import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Providers } from "@/components/providers/providers"
import { siteConfig } from "@/lib/site-config"
import { OG_IMAGE } from "@/lib/seo"
import "./globals.css"

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], display: "swap", axes: ["wdth", "opsz"] })
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })

// Google Analytics 4. Production builds only, so local development doesn't pollute the stats.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-NX3Y541H85"
const loadAnalytics = process.env.NODE_ENV === "production" && GA_ID

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: AI Meme Coin Idea & .fun Website Generator`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "meme coin generator",
    "meme coin name generator",
    "meme coin ideas",
    ".fun domain",
    "meme brand generator",
    "meme logo generator",
    "meme website builder",
    "Solana meme coin branding",
    "AI meme generator",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.tagline, images: [OG_IMAGE.url] },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0b11" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2f6" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
        <div aria-hidden className="grain" />
        <SpeedInsights />
        {loadAnalytics && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
