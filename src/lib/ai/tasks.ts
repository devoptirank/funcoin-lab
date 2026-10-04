import "server-only"
import type { z } from "zod"
import { getAIProvider } from "./index"
import { SYSTEM_PROMPT, brandContext, conceptPrompt } from "./prompts"
import {
  conceptOutputSchema,
  domainLabelsOutputSchema,
  logoOutputSchema,
  memesOutputSchema,
  socialOutputSchema,
  variationsOutputSchema,
  type brandRefSchema,
} from "./schemas"
import type { ConceptInput, ContentTypeId, MemeCardData, MemeConcept, SocialBios, SocialPlatform } from "@/lib/types"
import { sanitizeDeep } from "@/lib/safety"
import { generateConceptLocal, namingLabel, personalityLabel, themeLabel } from "@/lib/generator/concept"
import { generateContentLocal, generateSocialBiosLocal } from "@/lib/generator/social"
import { generateMemesLocal } from "@/lib/generator/memes"
import { generateDomainIdeas } from "@/lib/generator/domains"
import { slugify, tickerize, toDomain } from "@/lib/generator/text"

type BrandRef = z.infer<typeof brandRefSchema>
export type Sourced<T> = { data: T; source: "ai" | "local" }

const HEX = /^#[0-9a-f]{6}$/i

/** Run an AI task; on any failure (or no provider) use the local generator. Output is always sanitized. */
async function withFallback<T>(task: string, ai: (() => Promise<T>) | null, local: () => T): Promise<Sourced<T>> {
  if (ai) {
    try {
      return { data: sanitizeDeep(await ai()), source: "ai" }
    } catch (error) {
      console.error(`[ai] ${task} failed, using local generator:`, error instanceof Error ? error.message : error)
    }
  }
  return { data: sanitizeDeep(local()), source: "local" }
}

export async function generateConcept(input: ConceptInput): Promise<Sourced<MemeConcept>> {
  const provider = getAIProvider()
  // The local concept doubles as a structural backstop for any short or invalid AI fields.
  const base = generateConceptLocal(input)
  return withFallback(
    "concept",
    provider &&
      (async () => {
        const out = await provider.generateObject({
          task: "meme_concept",
          system: SYSTEM_PROMPT,
          prompt: conceptPrompt({
            topic: input.topic,
            theme: themeLabel(input.theme),
            personality: personalityLabel(input.personality),
            namingStyle: namingLabel(input.namingStyle),
          }),
          schema: conceptOutputSchema,
        })
        const palette = out.palette.filter((c) => HEX.test(c.hex)).slice(0, 5)
        const ticker = tickerize(out.ticker || out.name)
        return {
          ...base,
          source: "ai" as const,
          name: out.name.trim() || base.name,
          ticker,
          domain: toDomain(slugify(out.domainLabel) || out.name),
          tagline: out.tagline || base.tagline,
          traits: out.traits.length >= 2 ? out.traits.slice(0, 3) : base.traits,
          originStory: out.originStory || base.originStory,
          slogan: out.slogan || base.slogan,
          catchphrase: out.catchphrase || base.catchphrase,
          communityPhrases: out.communityPhrases.length ? out.communityPhrases.slice(0, 4) : base.communityPhrases,
          logoConcept: out.logoConcept || base.logoConcept,
          mascot: [...(out.mascotEmoji || "")].length <= 8 && out.mascotEmoji ? out.mascotEmoji : base.mascot,
          palette: palette.length >= 4 ? palette : base.palette,
          socialBio: out.socialBio || base.socialBio,
          websiteHeadline: out.websiteHeadline || base.websiteHeadline,
          websiteDescription: out.websiteDescription || base.websiteDescription,
          memeIdeas: out.memeIdeas.length >= 3 ? out.memeIdeas.slice(0, 6) : base.memeIdeas,
          launchIdeas: out.launchIdeas.length >= 3 ? out.launchIdeas.slice(0, 6) : base.launchIdeas,
          lore: out.lore.length >= 3 ? out.lore.slice(0, 5) : base.lore,
        }
      }),
    () => base,
  )
}

export async function generateDomains(topic: string): Promise<Sourced<string[]>> {
  const base = generateDomainIdeas(topic)
  const provider = getAIProvider()
  return withFallback(
    "domains",
    provider &&
      (async () => {
        const out = await provider.generateObject({
          task: "domain_ideas",
          system: SYSTEM_PROMPT,
          prompt: `Suggest 8 short, catchy, brandable .fun domain labels for a meme about ${JSON.stringify(
            topic,
          )}. Lowercase letters and digits only, no TLD.`,
          schema: domainLabelsOutputSchema,
          maxTokens: 1500,
        })
        const extra = out.labels.map((l) => slugify(l)).filter((l) => l.length >= 2).map((l) => `${l}.fun`)
        // Always lead with the predictable variants (sleepycat.fun, sleepycatcoin.fun, …).
        return [...new Set([...base.slice(0, 10), ...extra])].slice(0, 18)
      }),
    () => base,
  )
}

export async function generateContent(
  brand: BrandRef,
  platform: SocialPlatform,
  contentType: ContentTypeId,
): Promise<Sourced<string[]>> {
  const provider = getAIProvider()
  return withFallback(
    "content",
    provider &&
      (async () => {
        const out = await provider.generateObject({
          task: "social_content",
          system: SYSTEM_PROMPT,
          prompt: `${brandContext(brand)}

Write 4 different ${contentType} posts for ${platform}. Match the platform's style and length (X under 260 chars; TikTok/Instagram can include 2-4 hashtags; Discord/Telegram can be a bit longer and community-focused). Vary the angle of each one.`,
          schema: variationsOutputSchema,
          maxTokens: 3000,
        })
        if (out.variations.length < 2) throw new Error("too few variations")
        return out.variations.slice(0, 6)
      }),
    () => generateContentLocal(brand, platform, contentType),
  )
}

export async function generateSocialBios(brand: BrandRef): Promise<Sourced<SocialBios>> {
  const provider = getAIProvider()
  return withFallback(
    "social",
    provider &&
      (() =>
        provider.generateObject({
          task: "social_bios",
          system: SYSTEM_PROMPT,
          prompt: `${brandContext(brand)}

Write ready-to-paste profile bios: x (max 160 chars, 2-3 lines, emojis, end with the domain), instagram (max 150 chars, line breaks), tiktok (max 80 chars), telegram group description (2 short paragraphs, include "Not financial advice. Always verify links and contract addresses here."), discord server description (2-3 sentences mentioning channels).`,
          schema: socialOutputSchema,
          maxTokens: 2000,
        })),
    () => generateSocialBiosLocal(brand),
  )
}

export async function generateMemes(brand: BrandRef): Promise<Sourced<MemeCardData[]>> {
  const provider = getAIProvider()
  const local = () =>
    generateMemesLocal({ name: brand.name, mascot: brand.mascot, catchphrase: brand.catchphrase, traits: brand.traits })
  return withFallback(
    "memes",
    provider &&
      (async () => {
        const out = await provider.generateObject({
          task: "memes",
          system: SYSTEM_PROMPT,
          prompt: `${brandContext(brand)}

Write 6 relatable meme concepts starring this mascot. Each has a short caption (one sentence, relatable internet humor), plus classic image-macro topText and bottomText (each under 40 chars, uppercase).`,
          schema: memesOutputSchema,
          maxTokens: 2500,
        })
        const shells = local()
        return out.memes.slice(0, shells.length).map((m, i) => ({
          ...shells[i],
          caption: m.caption,
          topText: shells[i].layout === "top-bottom" ? m.topText.toUpperCase() : undefined,
          bottomText: shells[i].layout === "top-bottom" ? m.bottomText.toUpperCase() : undefined,
        }))
      }),
    local,
  )
}

export async function generateLogo(brand: BrandRef & { palette?: string[] }) {
  const provider = getAIProvider()
  const concept = await withFallback(
    "logo",
    provider &&
      (() =>
        provider.generateObject({
          task: "logo",
          system: SYSTEM_PROMPT,
          prompt: `${brandContext(brand)}
${brand.logoConcept ? `Previous concept (make a fresh variation): ${brand.logoConcept}` : ""}

Describe a new mascot logo concept (25-45 words: character, pose, accessories, framing, art style, colors). Also write an imagePrompt for an image model: a centered mascot logo on a plain background, flat vector, thick outlines, no text.`,
          schema: logoOutputSchema,
          maxTokens: 1500,
        })),
    () => ({
      description: brand.logoConcept ?? `${brand.name} mascot in a bold circular badge, thick cartoon outlines, sticker style.`,
      imagePrompt: "",
    }),
  )

  return { description: concept.data.description, imagePrompt: concept.data.imagePrompt, source: concept.source }
}
