import "server-only"
import { createAnthropicProvider } from "./providers/anthropic"
import { createOpenAIProvider } from "./providers/openai"
import type { AIProvider } from "./types"

export type { AIProvider } from "./types"

/**
 * Provider registry. Selected with AI_PROVIDER (anthropic | openai | local).
 * Returns null for "local", meaning: use the built-in template generator.
 * Keys are read here on the server only and never shipped to the browser.
 */
const registry: Record<string, (key: string, model?: string) => AIProvider> = {
  anthropic: (key, model) => createAnthropicProvider(key, model),
  openai: (key, model) => createOpenAIProvider(key, model, process.env.AI_BASE_URL || undefined),
}

let cached: { signature: string; provider: AIProvider | null } | null = null

export function getAIProvider(): AIProvider | null {
  const key = process.env.AI_API_KEY?.trim() ?? ""
  const name = (process.env.AI_PROVIDER?.trim().toLowerCase() || (key ? "anthropic" : "local")) as string
  const model = process.env.AI_MODEL?.trim() || undefined
  const signature = `${name}:${model}:${key.slice(-6)}`
  if (cached?.signature === signature) return cached.provider

  let provider: AIProvider | null = null
  if (name !== "local") {
    const factory = registry[name]
    if (!factory) console.warn(`[ai] Unknown AI_PROVIDER "${name}", falling back to local generator`)
    else if (!key) console.warn(`[ai] AI_PROVIDER="${name}" but AI_API_KEY is empty, falling back to local generator`)
    else provider = factory(key, model)
  }
  cached = { signature, provider }
  return provider
}

/** Image generation is configured separately so text and images can use different vendors. */
export function getImageProvider(): AIProvider | null {
  const name = process.env.IMAGE_PROVIDER?.trim().toLowerCase()
  if (!name || name === "none") return null
  const key = process.env.IMAGE_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim()
  if (!key) return null
  if (name === "openai") {
    return createOpenAIProvider(key, undefined, process.env.IMAGE_BASE_URL || undefined, process.env.IMAGE_MODEL || undefined)
  }
  console.warn(`[ai] Unknown IMAGE_PROVIDER "${name}"`)
  return null
}

export function aiStatus() {
  const p = getAIProvider()
  return { provider: p?.id ?? "local", model: p?.model ?? "funcoin-templates", images: Boolean(getImageProvider()) }
}
