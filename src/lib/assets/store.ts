"use client"
import { useCallback, useEffect, useState } from "react"
import { useStore } from "@/components/providers/store-provider"
import { useBilling } from "@/components/billing/billing-provider"
import type { AssetRecord, AssetType } from "@/lib/data/server"

export type { AssetRecord, AssetType }

/**
 * Generated images (logos, mascot poses, memes, banners, hero art). The server stores them in the
 * public Supabase Storage bucket "generated" under the wallet's account, so a site can reference
 * the public URL directly and published sites can show them.
 */

const EVENT = "fcl:assets"
const notify = () => window.dispatchEvent(new Event(EVENT))

export function useAssets(conceptId: string | null | undefined) {
  const { ready, address } = useStore()
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(EVENT, bump)
    return () => window.removeEventListener(EVENT, bump)
  }, [])
  useEffect(() => {
    if (!conceptId || !ready) return
    let alive = true
    fetch(`/api/me/assets?conceptId=${encodeURIComponent(conceptId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<AssetRecord[]>) : []))
      .then((list) => alive && setAssets(list))
      .catch(() => alive && setAssets([]))
    return () => {
      alive = false
    }
  }, [conceptId, ready, address, version])
  return assets
}

/** Resolve a stored image ref to something an <img> can show. Old browser-only refs ("asset:<id>") no longer exist. */
export function resolveAssetRef(ref: string | undefined | null): string | null {
  if (!ref || ref.startsWith("asset:")) return null
  return ref
}

export function useAssetUrl(ref: string | undefined | null) {
  return resolveAssetRef(ref)
}

/** Inline an image as a data: URL (for the standalone HTML export). */
export async function assetRefToDataUrl(ref: string): Promise<string | null> {
  const url = resolveAssetRef(ref)
  if (!url) return null
  try {
    const blob = await (await fetch(url)).blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export type ImageBrand = {
  subject?: string
  name: string
  ticker: string
  domain: string
  mascot: string
  tagline: string
  catchphrase: string
  slogan: string
  traits: string[]
  logoConcept?: string
  palette?: string[]
}

export function imageBrand(c: {
  name: string
  ticker: string
  domain: string
  mascot: string
  tagline: string
  catchphrase: string
  slogan: string
  traits: string[]
  logoConcept?: string
  subject?: string
  input?: { topic: string }
  palette: { hex: string }[]
}): ImageBrand {
  const { name, ticker, domain, mascot, tagline, catchphrase, slogan, traits, logoConcept } = c
  const subject = c.subject || c.input?.topic || undefined
  return { name, ticker, domain, mascot, subject, tagline, catchphrase, slogan, traits, logoConcept, palette: c.palette.map((p) => p.hex.toUpperCase()) }
}

/** Ask the server for an image; it charges credits, stores the file and returns the record. */
export class NeedsActionError extends Error {}

export function useGenerateAsset() {
  const billing = useBilling()
  return useCallback(
    async (conceptId: string, type: AssetType, brand: ImageBrand, extra: { pose?: string; scene?: string } = {}) => {
      if (!billing.signedIn) {
        void billing.ensureSignedIn()
        throw new NeedsActionError("Connect your wallet to generate AI images. New wallets get free credits.")
      }
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId, type, brand, ...extra }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; asset?: AssetRecord; balance?: number }
      if (typeof json.balance === "number") billing.setSnapshot({ balance: json.balance })
      if (res.status === 401) {
        await billing.refresh()
        void billing.ensureSignedIn()
        throw new NeedsActionError(json.error || "Connect your wallet first.")
      }
      if (res.status === 402) {
        billing.openBuy(json.error)
        throw new NeedsActionError(json.error || "Not enough credits.")
      }
      if (!res.ok || !json.asset) throw new Error(json.error || `Image generation failed (${res.status})`)
      notify()
      return json.asset
    },
    [billing],
  )
}

export function useRemoveAsset() {
  return useCallback(async (id: string) => {
    const res = await fetch(`/api/me/assets/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Couldn't delete the image")
    notify()
  }, [])
}
