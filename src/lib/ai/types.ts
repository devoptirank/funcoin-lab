import type { z } from "zod"

export type GenerateObjectRequest<T> = {
  /** Short identifier, used in logs and as the schema name. */
  task: string
  system: string
  prompt: string
  schema: z.ZodType<T>
  maxTokens?: number
}

export type GeneratedImage = { url?: string; b64?: string; mimeType?: string }
export type ImageOptions = { size?: string; quality?: "low" | "medium" | "high" | "auto" }

/**
 * Every AI backend implements this interface. Add a provider by creating a file in
 * lib/ai/providers/ and registering it in lib/ai/index.ts — nothing else changes.
 */
export interface AIProvider {
  readonly id: string
  readonly model: string
  generateObject<T>(req: GenerateObjectRequest<T>): Promise<T>
  /** Optional. Providers without image support simply omit it. */
  generateImage?(prompt: string, options?: ImageOptions): Promise<GeneratedImage | null>
  /** Optional content moderation. Returns true when the text should be blocked. */
  moderate?(text: string): Promise<boolean>
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly retryable = false,
  ) {
    super(message)
    this.name = "AIProviderError"
  }
}
