"use client"
import { useCallback, useSyncExternalStore } from "react"
import { X } from "lucide-react"

const EVENT = "fcl-announcement"
/** Dismissals for this page view, used when localStorage is blocked. */
const dismissed = new Set<string>()

/** Short stable hash of the announcement, so a new text shows again after an old one was dismissed. */
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(EVENT, cb)
  }
}

/**
 * Client wrapper for the announcement banner: hides it once dismissed in this browser (remembered
 * per text in localStorage) and after its end time.
 */
export function AnnouncementDismiss({ id, end, children, className }: { id: string; end: string; children: React.ReactNode; className?: string }) {
  const key = `fcl:announcement:${hash(id)}`
  const hidden = useSyncExternalStore(
    subscribe,
    useCallback(() => {
      if (end && Date.parse(end) <= Date.now()) return true
      if (dismissed.has(key)) return true
      try {
        return localStorage.getItem(key) === "1"
      } catch {
        return false
      }
    }, [key, end]),
    () => false,
  )
  if (hidden) return null

  const dismiss = () => {
    dismissed.add(key)
    try {
      localStorage.setItem(key, "1")
    } catch {
      // Storage blocked: hide for this page view only.
    }
    window.dispatchEvent(new Event(EVENT))
  }

  return (
    <div role="region" aria-label="Announcement" className={className}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <div className="min-w-0 flex-1 text-sm">{children}</div>
        <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-foreground/10">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
