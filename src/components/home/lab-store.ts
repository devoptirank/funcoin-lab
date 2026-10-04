"use client"

// Shared, mutable state between the hero input and the 3D flask. Read every frame inside
// useFrame, so typing never re-renders React or the canvas tree.

export const LIQUID_COLORS = ["#c6f432", "#7b5cff", "#ff5ca8", "#5ad7f0", "#ffb020", "#3ee6a0"] as const

export const labState = {
  /** Target liquid color; the scene eases toward it. */
  color: LIQUID_COLORS[0] as string,
  /** 0 = calm, 1 = boiling over. Decays back to 0 inside the scene. */
  boil: 0,
  /** Extra bubble energy from typing; decays quickly. */
  fizz: 0,
}

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

export function setLabTopic(text: string) {
  const t = text.trim().toLowerCase()
  labState.color = t ? LIQUID_COLORS[hash(t) % LIQUID_COLORS.length] : LIQUID_COLORS[0]
  labState.fizz = Math.min(1, labState.fizz + 0.35)
}

export function boilOver() {
  labState.boil = 1
}
