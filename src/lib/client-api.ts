"use client"

export class ApiError extends Error {}

/** POST JSON to one of our API routes and return the parsed body, throwing a friendly error. */
export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(json.error || `Request failed (${res.status})`)
  return json
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadFile(filename: string, content: string | Blob, type = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function brandRef(c: {
  name: string
  ticker: string
  domain: string
  mascot: string
  tagline: string
  catchphrase: string
  slogan: string
  traits: string[]
  logoConcept?: string
}) {
  const { name, ticker, domain, mascot, tagline, catchphrase, slogan, traits, logoConcept } = c
  return { name, ticker, domain, mascot, tagline, catchphrase, slogan, traits, logoConcept }
}
