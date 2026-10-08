import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"

export const alt = "FunCoin Lab: Turn ridiculous ideas into unforgettable meme brands."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage() {
  const coin = await readFile(path.join(process.cwd(), "public/coins/funcoinlab.png"))
  const coinSrc = `data:image/png;base64,${coin.toString("base64")}`
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "radial-gradient(60% 70% at 85% 30%, #3a2a8a 0%, transparent 60%), #0c0b11",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#C6F432" }}>FunCoin Lab</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.02, marginTop: 20 }}>Turn ridiculous ideas into unforgettable meme brands.</div>
          <div style={{ display: "flex", fontSize: 28, marginTop: 28, opacity: 0.8 }}>Names, .fun domains, AI art, logos and websites</div>
        </div>
        <img src={coinSrc} width={380} height={380} alt="" />
      </div>
    ),
    size,
  )
}
