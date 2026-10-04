"use client"
import { useEffect, useState } from "react"
import type { MemeConcept } from "@/lib/types"

// The most recently generated concept, so standalone tools (logo, memes, social…) can pick it up.
const KEY = "fcl:current"
const EVENT = "fcl:current"

export function getCurrentConcept(): MemeConcept | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MemeConcept) : null
  } catch {
    return null
  }
}

export function setCurrentConcept(concept: MemeConcept) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(concept))
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function useCurrentConcept() {
  const [concept, setConcept] = useState<MemeConcept | null>(null)
  useEffect(() => {
    const sync = () => setConcept(getCurrentConcept())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])
  return concept
}
