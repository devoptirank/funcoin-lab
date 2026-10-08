import { readFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { ImageResponse } from "next/og"
import { DISCOVER_PROJECTS } from "@/lib/discover"

const size = { width: 1200, height: 630 }

// Social preview image for /discover/<slug>: GET /og/coin/<slug>

/** Satori can't draw WebP, so the coin (or the mascot, before its coin exists) is converted to PNG. */
async function artDataUrl(...urls: string[]) {
  for (const u of urls) {
    try {
      const png = await sharp(await readFile(path.join(process.cwd(), "public", u))).resize(460, 460, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
      return `data:image/png;base64,${png.toString("base64")}`
    } catch {}
  }
  return null
}

export async function GET(_req: Request, ctx: RouteContext<"/og/coin/[slug]">) {
  const { slug } = await ctx.params
  const p = DISCOVER_PROJECTS.find((x) => x.slug === slug) ?? DISCOVER_PROJECTS[0]
  const art = await artDataUrl(p.coin, p.mascot)
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 72px", background: `radial-gradient(circle at 78% 45%, ${p.colors[0]}55, #0c0b11 60%)`, color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div style={{ fontSize: 30, color: "#c6f432" }}>{`$${p.ticker}`}</div>
          <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1, marginTop: 12 }}>{p.name}</div>
          <div style={{ fontSize: 32, color: "#cfcbe0", marginTop: 24, lineHeight: 1.3 }}>{p.description}</div>
          <div style={{ fontSize: 26, color: "#9b96b0", marginTop: 36 }}>{`${p.domain}  |  funcoinlab.com`}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
        {art ? <img src={art} width={460} height={460} alt="" /> : null}
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  )
}
