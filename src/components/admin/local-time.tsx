"use client"
import { useSyncExternalStore } from "react"

const noop = () => () => {}

/** Shows a UTC timestamp in the viewer's local timezone (UTC during server render, local after). */
export function When({ iso }: { iso: string | null | undefined }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  if (!iso) return <span className="text-muted-foreground">-</span>
  const d = new Date(iso)
  return (
    <time dateTime={iso} title={iso} className="whitespace-nowrap">
      {mounted ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`}
    </time>
  )
}
