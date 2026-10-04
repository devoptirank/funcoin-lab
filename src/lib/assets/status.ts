"use client"
import { useEffect, useState } from "react"

let cached: Promise<boolean> | null = null

/** Whether AI image generation is configured on the server (provider names only, never keys). */
export function useImagesEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  useEffect(() => {
    cached ??= fetch("/api/status")
      .then((r) => r.json())
      .then((j: { ai?: { images?: boolean } }) => Boolean(j.ai?.images))
      .catch(() => false)
    let alive = true
    cached.then((v) => alive && setEnabled(v))
    return () => {
      alive = false
    }
  }, [])
  return enabled
}
