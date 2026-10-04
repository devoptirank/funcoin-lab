"use client"
import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useStore } from "@/components/providers/store-provider"
import { useBilling } from "@/components/billing/billing-provider"
import { getSupabaseBrowser } from "@/lib/supabase/client"

/**
 * Generated images (logos, mascot poses, memes, banners, hero art).
 *
 * Guests: blobs live in this browser's IndexedDB; a site references them as "asset:<id>".
 * Signed in: files go to the public Supabase Storage bucket "generated" (so published sites can
 * show them) with a row in generated_assets; a site references the public URL directly.
 */

export type AssetType = "logo" | "mascot" | "meme" | "banner" | "site-hero"

export type AssetRecord = {
  id: string
  conceptId: string
  type: AssetType
  pose: string | null
  mime: string
  /** Displayable URL (object URL for local assets, public URL for cloud assets). */
  url: string
  /** What to store in a site config: "asset:<id>" locally, the public URL in the cloud. */
  ref: string
  createdAt: string
}

type LocalRow = {
  id: string
  conceptId: string
  type: AssetType
  pose: string | null
  mime: string
  blob: Blob
  prompt: string
  model: string
  createdAt: string
}

type SaveInput = { conceptId: string; type: AssetType; pose: string | null; blob: Blob; prompt: string; model: string }

interface AssetBackend {
  list(conceptId: string): Promise<AssetRecord[]>
  save(input: SaveInput): Promise<AssetRecord>
  remove(id: string): Promise<void>
}

const EVENT = "fcl:assets"
const notify = () => window.dispatchEvent(new Event(EVENT))

// ---------------- IndexedDB (guest) ----------------

const DB = "fcl-assets"
const STORE = "assets"
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" })
      store.createIndex("conceptId", "conceptId")
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

// One object URL per asset id, reused across renders to avoid leaking blobs.
const objectUrls = new Map<string, string>()
const urlFor = (row: LocalRow) => {
  let url = objectUrls.get(row.id)
  if (!url) {
    url = URL.createObjectURL(row.blob)
    objectUrls.set(row.id, url)
  }
  return url
}
const toRecord = (row: LocalRow): AssetRecord => ({
  id: row.id,
  conceptId: row.conceptId,
  type: row.type,
  pose: row.pose,
  mime: row.mime,
  url: urlFor(row),
  ref: `asset:${row.id}`,
  createdAt: row.createdAt,
})

const localBackend: AssetBackend = {
  async list(conceptId) {
    const rows = await tx<LocalRow[]>("readonly", (s) => s.index("conceptId").getAll(conceptId))
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toRecord)
  },
  async save(input) {
    const row: LocalRow = { id: crypto.randomUUID(), mime: input.blob.type || "image/webp", createdAt: new Date().toISOString(), ...input }
    await tx("readwrite", (s) => s.put(row))
    return toRecord(row)
  },
  async remove(id) {
    await tx("readwrite", (s) => s.delete(id))
    const url = objectUrls.get(id)
    if (url) URL.revokeObjectURL(url)
    objectUrls.delete(id)
  },
}

// ---------------- Supabase (signed in) ----------------

type CloudRow = { id: string; concept_id: string; type: AssetType; pose: string | null; mime: string; storage_path: string; created_at: string }

function cloudBackend(sb: SupabaseClient, userId: string): AssetBackend {
  const publicUrl = (path: string) => sb.storage.from("generated").getPublicUrl(path).data.publicUrl
  const toRec = (r: CloudRow): AssetRecord => {
    const url = publicUrl(r.storage_path)
    return { id: r.id, conceptId: r.concept_id, type: r.type, pose: r.pose, mime: r.mime, url, ref: url, createdAt: r.created_at }
  }
  return {
    async list(conceptId) {
      const { data, error } = await sb
        .from("generated_assets")
        .select("id, concept_id, type, pose, mime, storage_path, created_at")
        .eq("concept_id", conceptId)
        .order("created_at", { ascending: false })
      if (error) throw new Error(error.message)
      return (data as CloudRow[]).map(toRec)
    },
    async save(input) {
      const ext = input.blob.type.split("/")[1] || "webp"
      const path = `${userId}/${input.conceptId}/${input.type}/${crypto.randomUUID()}.${ext}`
      const up = await sb.storage.from("generated").upload(path, input.blob, { contentType: input.blob.type, upsert: false })
      if (up.error) throw new Error(up.error.message)
      const { data, error } = await sb
        .from("generated_assets")
        .insert({ user_id: userId, concept_id: input.conceptId, type: input.type, pose: input.pose, mime: input.blob.type, storage_path: path, prompt: input.prompt, model: input.model })
        .select("id, concept_id, type, pose, mime, storage_path, created_at")
        .single()
      if (error) throw new Error(error.message)
      return toRec(data as CloudRow)
    },
    async remove(id) {
      const { data } = await sb.from("generated_assets").select("storage_path").eq("id", id).maybeSingle()
      if (data?.storage_path) await sb.storage.from("generated").remove([data.storage_path])
      const { error } = await sb.from("generated_assets").delete().eq("id", id)
      if (error) throw new Error(error.message)
    },
  }
}

// ---------------- Hooks & helpers ----------------

export function useAssetBackend(): AssetBackend {
  const { user } = useStore()
  const sb = getSupabaseBrowser()
  return sb && user ? cloudBackend(sb, user.id) : localBackend
}

export function useAssets(conceptId: string | null | undefined) {
  const backend = useAssetBackend()
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(EVENT, bump)
    return () => window.removeEventListener(EVENT, bump)
  }, [])
  useEffect(() => {
    if (!conceptId) return
    let alive = true
    backend
      .list(conceptId)
      .then((list) => alive && setAssets(list))
      .catch(() => alive && setAssets([]))
    return () => {
      alive = false
    }
    // backend identity changes per render; the user id is what matters and is reflected in version via auth events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId, version])
  return assets
}

/** Resolve a stored ref ("asset:<id>" or URL) to something an <img> can show. */
export async function resolveAssetRef(ref: string | undefined | null): Promise<string | null> {
  if (!ref) return null
  if (!ref.startsWith("asset:")) return ref
  const id = ref.slice("asset:".length)
  const row = await tx<LocalRow | undefined>("readonly", (s) => s.get(id)).catch(() => undefined)
  return row ? urlFor(row) : null
}

export function useAssetUrl(ref: string | undefined | null) {
  const [url, setUrl] = useState<string | null>(ref && !ref.startsWith("asset:") ? ref : null)
  useEffect(() => {
    let alive = true
    resolveAssetRef(ref).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [ref])
  return url
}

/** Inline an asset as a data: URL (for the standalone HTML export). */
export async function assetRefToDataUrl(ref: string): Promise<string | null> {
  const url = await resolveAssetRef(ref)
  if (!url) return null
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

export type ImageBrand = {
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
  palette: { hex: string }[]
}): ImageBrand {
  const { name, ticker, domain, mascot, tagline, catchphrase, slogan, traits, logoConcept } = c
  return { name, ticker, domain, mascot, tagline, catchphrase, slogan, traits, logoConcept, palette: c.palette.map((p) => p.hex.toUpperCase()) }
}

/** Ask the server for an image, then store it with the right backend. */
export class NeedsActionError extends Error {}

export function useGenerateAsset() {
  const backend = useAssetBackend()
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
        body: JSON.stringify({ type, brand, ...extra }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; code?: string; b64?: string; mimeType?: string; prompt?: string; model?: string; balance?: number; cost?: number }
      if (typeof json.balance === "number") billing.setSnapshot({ balance: json.balance })
      if (res.status === 401) {
        await billing.refresh()
        void billing.ensureSignedIn()
        throw new NeedsActionError(json.error || "Sign in with your wallet first.")
      }
      if (res.status === 402) {
        billing.openBuy(json.error)
        throw new NeedsActionError(json.error || "Not enough credits.")
      }
      if (!res.ok || !json.b64) throw new Error(json.error || `Image generation failed (${res.status})`)
      const bytes = Uint8Array.from(atob(json.b64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: json.mimeType ?? "image/webp" })
      const record = await backend.save({ conceptId, type, pose: extra.pose ?? null, blob, prompt: json.prompt ?? "", model: json.model ?? "" })
      notify()
      return record
    },
    [backend, billing],
  )
}

export function useRemoveAsset() {
  const backend = useAssetBackend()
  return useCallback(
    async (id: string) => {
      await backend.remove(id)
      notify()
    },
    [backend],
  )
}
