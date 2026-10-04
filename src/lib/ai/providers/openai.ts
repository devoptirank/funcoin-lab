import "server-only"
import { z } from "zod"
import { AIProviderError, type AIProvider, type GenerateObjectRequest, type ImageOptions } from "../types"

// OpenAI-compatible provider over plain fetch (no extra SDK). Also works with any
// endpoint that implements the Chat Completions + Images API (set AI_BASE_URL).

export function createOpenAIProvider(
  apiKey: string,
  model = "gpt-4o-mini",
  baseUrl = "https://api.openai.com/v1",
  imageModel = "gpt-image-2",
): AIProvider {
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }

  return {
    id: "openai",
    model,
    async generateObject<T>({ task, system, prompt, schema, maxTokens = 8000 }: GenerateObjectRequest<T>) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: task.replace(/\W/g, "_"), schema: z.toJSONSchema(schema), strict: false },
          },
        }),
      })
      if (!res.ok) {
        throw new AIProviderError(`OpenAI error ${res.status}`, "openai", res.status === 429 || res.status >= 500)
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const content = json.choices?.[0]?.message?.content
      if (!content) throw new AIProviderError("Empty OpenAI response", "openai", true)
      const parsed = schema.safeParse(JSON.parse(content))
      if (!parsed.success) throw new AIProviderError(`Schema mismatch for task "${task}"`, "openai", true)
      return parsed.data
    },
    // GPT image models always return base64. gpt-image-2 has no transparent backgrounds, so we
    // request webp on an opaque background to keep payloads small.
    async generateImage(prompt: string, options: ImageOptions = {}) {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          model: imageModel,
          prompt,
          size: options.size ?? "1024x1024",
          quality: options.quality ?? "medium",
          output_format: "webp",
          output_compression: 82,
          n: 1,
        }),
      })
      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null
        const blocked = detail?.error?.code === "moderation_blocked"
        throw new AIProviderError(
          blocked ? "That image request was blocked by the content filter." : `OpenAI image error ${res.status}: ${detail?.error?.message ?? ""}`.trim(),
          "openai",
          res.status >= 500,
        )
      }
      const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] }
      const item = json.data?.[0]
      if (!item) return null
      return { url: item.url, b64: item.b64_json, mimeType: "image/webp" }
    },
    async moderate(text: string) {
      const res = await fetch(`${baseUrl}/moderations`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
      })
      if (!res.ok) throw new AIProviderError(`OpenAI moderation error ${res.status}`, "openai", res.status >= 500)
      const json = (await res.json()) as { results?: { flagged?: boolean }[] }
      return Boolean(json.results?.[0]?.flagged)
    },
  }
}
