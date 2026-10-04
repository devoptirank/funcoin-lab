import { ImageResponse } from "next/og"

export const alt = "FunCoin Lab: Turn ridiculous ideas into unforgettable meme brands."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background: "radial-gradient(60% 70% at 10% 0%, #A855F7 0%, transparent 60%), radial-gradient(50% 60% at 100% 30%, #FF3D9A 0%, transparent 60%), #07060B",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, opacity: 0.85 }}>FunCoin Lab</div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.02, marginTop: 24, maxWidth: 980 }}>
          Turn ridiculous ideas into unforgettable meme brands.
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 36, color: "#39FF88" }}>Names · .fun domains · lore · logos · websites</div>
      </div>
    ),
    size,
  )
}
