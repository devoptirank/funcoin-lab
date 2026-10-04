import { z } from "zod"
import { CONTENT_TYPES, NAMING_STYLES, PERSONALITIES, THEMES } from "@/lib/types"

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as unknown as [T[number]["id"], ...T[number]["id"][]]

// ---------- Request validation (API route inputs) ----------

export const conceptRequestSchema = z.object({
  topic: z.string().trim().max(80).default(""),
  theme: z.enum(ids(THEMES)).default("random"),
  personality: z.enum(ids(PERSONALITIES)).default("random"),
  namingStyle: z.enum(ids(NAMING_STYLES)).default("oneword"),
  seed: z.number().int().nonnegative().optional(),
})

export const brandRefSchema = z.object({
  name: z.string().trim().min(1).max(60),
  ticker: z.string().trim().max(12).default(""),
  domain: z.string().trim().max(80).default(""),
  mascot: z.string().max(16).default("✨"),
  tagline: z.string().max(200).default(""),
  catchphrase: z.string().max(140).default(""),
  slogan: z.string().max(140).default(""),
  traits: z.array(z.string().max(30)).max(6).default([]),
  logoConcept: z.string().max(600).optional(),
})

export const contentRequestSchema = z.object({
  brand: brandRefSchema,
  platform: z.enum(["x", "instagram", "tiktok", "telegram", "discord"]),
  contentType: z.enum(ids(CONTENT_TYPES)),
})

export const domainRequestSchema = z.object({ topic: z.string().trim().min(1).max(60) })
export const domainCheckSchema = z.object({ domains: z.array(z.string().trim().toLowerCase().max(70)).min(1).max(20) })

// ---------- AI output schemas (kept simple for structured-output compatibility) ----------

export const conceptOutputSchema = z.object({
  name: z.string().describe("Meme coin concept name, 1-4 words"),
  ticker: z.string().describe("Ticker concept, 3-8 uppercase letters, no $"),
  domainLabel: z.string().describe("Lowercase letters/digits only, used as <label>.fun"),
  tagline: z.string().describe("One-line description, under 70 characters"),
  traits: z.array(z.string()).describe("Exactly 3 single-word personality traits"),
  originStory: z.string().describe("Humorous origin story for the mascot, 60-90 words"),
  slogan: z.string(),
  catchphrase: z.string(),
  communityPhrases: z.array(z.string()).describe("3 short community phrases"),
  logoConcept: z.string().describe("Visual logo description for an illustrator, 25-45 words"),
  mascotEmoji: z.string().describe("A single emoji representing the mascot"),
  palette: z
    .array(z.object({ name: z.string(), hex: z.string().describe("#RRGGBB") }))
    .describe("5 colors; the last one very dark for backgrounds"),
  socialBio: z.string().describe("X bio, 3 short lines with emojis, ending with the .fun domain"),
  websiteHeadline: z.string(),
  websiteDescription: z.string().describe("2 sentences"),
  memeIdeas: z.array(z.string()).describe("5 meme caption ideas"),
  launchIdeas: z.array(z.string()).describe("5 creative launch-content ideas (never financial)"),
  lore: z
    .array(z.object({ title: z.string(), text: z.string() }))
    .describe("4 timeline steps: born online, discovered by meme creators, community goes wild, the legend grows"),
})
export type ConceptOutput = z.infer<typeof conceptOutputSchema>

export const variationsOutputSchema = z.object({ variations: z.array(z.string()) })

export const socialOutputSchema = z.object({
  x: z.string(),
  telegram: z.string(),
  discord: z.string(),
  instagram: z.string(),
  tiktok: z.string(),
})

export const memesOutputSchema = z.object({
  memes: z.array(z.object({ caption: z.string(), topText: z.string(), bottomText: z.string() })),
})

export const logoOutputSchema = z.object({ description: z.string(), imagePrompt: z.string() })

export const domainLabelsOutputSchema = z.object({ labels: z.array(z.string()) })
