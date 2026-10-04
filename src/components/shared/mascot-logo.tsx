"use client"
import { forwardRef, useId } from "react"
import { downloadFile } from "@/lib/client-api"
import { cn } from "@/lib/utils"

export const LOGO_VARIANTS = 5

type Props = {
  name: string
  ticker: string
  mascot: string
  colors: string[]
  variant?: number
  className?: string
  animated?: boolean
  showRing?: boolean
}

// Coordinates are rounded so server (Node) and browser trig output match during hydration.
/** Procedural vector badge logo. Same inputs → same logo; bump `variant` to regenerate. */
export const MascotLogo = forwardRef<SVGSVGElement, Props>(function MascotLogo(
  { name, ticker, mascot, colors, variant = 0, className, animated = false, showRing = true },
  ref,
) {
  const id = useId().replace(/:/g, "")
  const [c1 = "#A855F7", c2 = "#FF3D9A", c3 = "#22D3EE"] = colors
  const v = ((variant % LOGO_VARIANTS) + LOGO_VARIANTS) % LOGO_VARIANTS
  const ringText = `$${ticker} • ${name.toUpperCase()} • `.repeat(3)

  const shape = (() => {
    switch (v) {
      case 1:
        return <rect x="56" y="56" width="400" height="400" rx="110" fill={`url(#g-${id})`} />
      case 2: {
        const pts = Array.from({ length: 24 }, (_, i) => {
          const r = i % 2 ? 175 : 215
          const a = (Math.PI * 2 * i) / 24
          return `${(256 + r * Math.cos(a)).toFixed(2)},${(256 + r * Math.sin(a)).toFixed(2)}`
        }).join(" ")
        return <polygon points={pts} fill={`url(#g-${id})`} strokeLinejoin="round" />
      }
      case 3:
        return <path d="M256 40 L440 110 V250 C440 360 360 440 256 476 C152 440 72 360 72 250 V110 Z" fill={`url(#g-${id})`} />
      case 4: {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 2
          return `${(256 + 210 * Math.cos(a)).toFixed(2)},${(256 + 210 * Math.sin(a)).toFixed(2)}`
        }).join(" ")
        return <polygon points={pts} fill={`url(#g-${id})`} />
      }
      default:
        return <circle cx="256" cy="256" r="210" fill={`url(#g-${id})`} />
    }
  })()

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      role="img"
      aria-label={`${name} logo concept`}
      className={cn("h-auto w-full", className)}
    >
      <title>{`${name} logo concept (FunCoin Lab)`}</title>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
        <radialGradient id={`s-${id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <path id={`ring-${id}`} d="M256,256 m-176,0 a176,176 0 1,1 352,0 a176,176 0 1,1 -352,0" />
      </defs>
      <g stroke="#0B0912" strokeWidth="14">{shape}</g>
      <g style={{ mixBlendMode: "screen" }}>{shape && <circle cx="256" cy="256" r="200" fill={`url(#s-${id})`} />}</g>
      {showRing && (v === 0 || v === 2) && (
        <text fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="22" letterSpacing="3" fill="#0B0912" opacity="0.8">
          <textPath href={`#ring-${id}`}>{ringText}</textPath>
        </text>
      )}
      <circle cx="256" cy="262" r="118" fill="#0B0912" opacity="0.12" />
      <text
        x="256"
        y="262"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="170"
        style={animated ? { transformOrigin: "256px 262px", animation: "fc-wobble 3s ease-in-out infinite" } : undefined}
      >
        {mascot}
      </text>
      <g fill="#fff">
        <path d="M410 96 l8 20 20 8 -20 8 -8 20 -8 -20 -20 -8 20 -8z" opacity="0.9" />
        <path d="M110 380 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" opacity="0.8" />
      </g>
      {(v === 1 || v === 3 || v === 4) && (
        <g>
          <rect x="146" y="396" width="220" height="56" rx="28" fill="#0B0912" />
          <text x="256" y="425" textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="30" fill="#fff">
            ${ticker}
          </text>
        </g>
      )}
    </svg>
  )
})

export function downloadSvg(svg: SVGSVGElement | null, filename: string) {
  if (!svg) return
  const markup = new XMLSerializer().serializeToString(svg)
  downloadFile(filename, `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`, "image/svg+xml")
}

export async function downloadPng(svg: SVGSVGElement | null, filename: string, size = 1024) {
  if (!svg) return
  const markup = new XMLSerializer().serializeToString(svg)
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  await img.decode()
  const canvas = Object.assign(document.createElement("canvas"), { width: size, height: size })
  canvas.getContext("2d")?.drawImage(img, 0, 0, size, size)
  canvas.toBlob((blob) => blob && downloadFile(filename, blob))
}
