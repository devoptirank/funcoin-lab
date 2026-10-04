"use client"

/** Celebratory bubble burst from an element. No dependencies; skipped when motion is reduced. */
export function burst(from: Element | null, color = "var(--lab)") {
  if (!from || typeof window === "undefined") return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const r = from.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const layer = document.createElement("div")
  layer.setAttribute("aria-hidden", "true")
  Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "70" })
  document.body.appendChild(layer)
  const count = 14
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span")
    const size = 6 + Math.random() * 10
    Object.assign(dot.style, {
      position: "absolute",
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      background: i % 3 === 0 ? "transparent" : color,
      border: i % 3 === 0 ? `2px solid ${color}` : "none",
    })
    layer.appendChild(dot)
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const dist = 40 + Math.random() * 60
    dot.animate(
      [
        { transform: "translate(0,0) scale(0.4)", opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 30}px) scale(1)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    )
  }
  window.setTimeout(() => layer.remove(), 1100)
}
