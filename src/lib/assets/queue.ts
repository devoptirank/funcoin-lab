"use client"
import { useSyncExternalStore } from "react"

/**
 * Client-side queue for AI image jobs. At most MAX_RUNNING requests run at once (the server also
 * rate-limits bursts); the rest wait in order. Each job carries an estimate so the UI can count down.
 * Estimates learn from real durations per image type and are kept in localStorage.
 */

export type JobStatus = "queued" | "running" | "done" | "error"
export type ImageJob = {
  id: string
  label: string
  type: string
  status: JobStatus
  queuedAt: number
  startedAt?: number
  finishedAt?: number
  /** Expected run time in ms, from past jobs of this type. */
  etaMs: number
  error?: string
}

const MAX_RUNNING = 2
const KEEP_FINISHED_MS = 4000
const DEFAULT_ETA: Record<string, number> = { logo: 35_000, mascot: 40_000, meme: 35_000, banner: 50_000, "site-hero": 50_000 }
const ETA_KEY = "fcl:image-eta"

let jobs: ImageJob[] = []
const listeners = new Set<() => void>()
const runners = new Map<string, () => Promise<void>>()

const emit = () => {
  jobs = [...jobs]
  listeners.forEach((l) => l())
}

function readEta(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ETA_KEY) || "{}") as Record<string, number>
  } catch {
    return {}
  }
}

/** Blend a new measurement into the stored average (recent runs count more). */
function learnEta(type: string, ms: number) {
  if (ms < 3000 || ms > 240_000) return
  const all = readEta()
  const prev = all[type] ?? DEFAULT_ETA[type] ?? 40_000
  all[type] = Math.round(prev * 0.6 + ms * 0.4)
  try {
    localStorage.setItem(ETA_KEY, JSON.stringify(all))
  } catch {}
}

const etaFor = (type: string) => readEta()[type] ?? DEFAULT_ETA[type] ?? 40_000

function update(id: string, patch: Partial<ImageJob>) {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
  emit()
}

function pump() {
  while (jobs.filter((j) => j.status === "running").length < MAX_RUNNING) {
    const next = jobs.find((j) => j.status === "queued")
    if (!next) return
    // Re-read the estimate at start, so it reflects jobs that just finished.
    update(next.id, { status: "running", startedAt: Date.now(), etaMs: etaFor(next.type) })
    void runners.get(next.id)?.()
  }
}

/** Add a job; resolves or rejects with the task's own result once it has run. */
export function enqueueImage<T>(meta: { label: string; type: string }, task: () => Promise<T>): Promise<T> {
  const id = crypto.randomUUID()
  jobs = [...jobs, { id, label: meta.label, type: meta.type, status: "queued", queuedAt: Date.now(), etaMs: etaFor(meta.type) }]
  emit()
  return new Promise<T>((resolve, reject) => {
    runners.set(id, async () => {
      const started = Date.now()
      try {
        const result = await task()
        learnEta(meta.type, Date.now() - started)
        update(id, { status: "done", finishedAt: Date.now() })
        resolve(result)
      } catch (e) {
        update(id, { status: "error", finishedAt: Date.now(), error: e instanceof Error ? e.message : "Failed" })
        reject(e)
      } finally {
        runners.delete(id)
        window.setTimeout(() => {
          jobs = jobs.filter((j) => j.id !== id)
          emit()
        }, KEEP_FINISHED_MS)
        pump()
      }
    })
    pump()
  })
}

export function dismissJob(id: string) {
  jobs = jobs.filter((j) => j.id !== id || j.status === "running" || j.status === "queued")
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const EMPTY: ImageJob[] = []

export function useImageJobs(): ImageJob[] {
  return useSyncExternalStore(subscribe, () => jobs, () => EMPTY)
}

/** Position in line (1 = next to start), or 0 if not waiting. */
export function queuePosition(all: ImageJob[], id: string) {
  const waiting = all.filter((j) => j.status === "queued")
  return waiting.findIndex((j) => j.id === id) + 1
}
