import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { AIProviderError, type AIProvider, type GenerateObjectRequest } from "../types"

export const ANTHROPIC_DEFAULT_MODEL = "claude-opus-5-5"

export function createAnthropicProvider(apiKey: string, model = ANTHROPIC_DEFAULT_MODEL): AIProvider {
  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 })

  return {
    id: "anthropic",
    model,
    async generateObject<T>({ task, system, prompt, schema, maxTokens = 8000 }: GenerateObjectRequest<T>) {
      try {
        const response = await client.messages.parse({
          model,
          max_tokens: maxTokens,
          system,
          // Short creative copy: low effort keeps latency and cost down without hurting quality.
          output_config: { effort: "low", format: zodOutputFormat(schema) },
          messages: [{ role: "user", content: prompt }],
        })
        if (response.stop_reason === "refusal") {
          throw new AIProviderError(`Model declined task "${task}"`, "anthropic")
        }
        if (response.parsed_output == null) {
          throw new AIProviderError(`No parseable output for task "${task}" (stop: ${response.stop_reason})`, "anthropic", true)
        }
        return response.parsed_output as T
      } catch (error) {
        if (error instanceof AIProviderError) throw error
        if (error instanceof Anthropic.AuthenticationError) {
          throw new AIProviderError("Invalid AI_API_KEY for Anthropic", "anthropic")
        }
        if (error instanceof Anthropic.RateLimitError) {
          throw new AIProviderError("Anthropic rate limit reached", "anthropic", true)
        }
        if (error instanceof Anthropic.APIError) {
          throw new AIProviderError(`Anthropic API error ${error.status}: ${error.message}`, "anthropic", true)
        }
        throw new AIProviderError(error instanceof Error ? error.message : String(error), "anthropic", true)
      }
    },
  }
}
