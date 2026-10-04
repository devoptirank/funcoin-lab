import type {
  ConceptInput,
  MemeConcept,
  NamingStyleId,
  PersonalityId,
  ThemeId,
} from "@/lib/types"
import { NAMING_STYLES, PERSONALITIES, THEMES } from "@/lib/types"
import { sanitizeDeep } from "@/lib/safety"
import {
  CATCHPHRASES,
  COMMUNITY_PHRASES,
  FALLBACK_EMOJI,
  GOALS,
  HOBBIES,
  KEYWORD_EMOJI,
  MOOD_EMOJI,
  LAUNCH_IDEAS,
  LOGO_PROPS,
  LOGO_SCENES,
  LOGO_STYLES,
  LORE_TITLES,
  MEME_TEMPLATES,
  ORIGIN_TEMPLATES,
  PERSONALITY_BANK,
  RELATABLE,
  SLOGAN_TEMPLATES,
  SUFFIXES,
  THEME_SUBJECTS,
} from "./banks"
import { createRng, randomSeed, uid, type Rng } from "./random"
import { cap, fill, tickerize, titleCase, toDomain } from "./text"

type ConcreteTheme = keyof typeof THEME_SUBJECTS
type ConcretePersonality = keyof typeof PERSONALITY_BANK

export type Subject = { text: string; words: string[]; main: string; compact: string; emoji: string }

export function emojiForTopic(topic: string, rng?: Rng): string {
  for (const [pattern, emoji] of [...KEYWORD_EMOJI, ...MOOD_EMOJI]) if (pattern.test(topic)) return emoji
  return rng ? rng.pick(FALLBACK_EMOJI) : FALLBACK_EMOJI[0]
}

export function resolveSubject(topic: string, theme: ThemeId, rng: Rng): Subject {
  const cleaned = topic.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40)
  let text: string
  let emoji: string
  if (cleaned) {
    text = titleCase(cleaned)
    emoji = emojiForTopic(cleaned, rng)
  } else {
    const concrete: ConcreteTheme =
      theme === "random" || theme === "custom"
        ? rng.pick(Object.keys(THEME_SUBJECTS) as ConcreteTheme[])
        : theme
    const s = rng.pick(THEME_SUBJECTS[concrete])
    text = s.word
    emoji = s.emoji
  }
  const words = text.split(" ").filter(Boolean)
  return {
    text,
    words,
    main: words[words.length - 1],
    compact: words.map((w) => cap(w.toLowerCase())).join(""),
    emoji,
  }
}

function resolvePersonality(p: PersonalityId, rng: Rng): ConcretePersonality {
  return p === "random" ? rng.pick(Object.keys(PERSONALITY_BANK) as ConcretePersonality[]) : p
}

export function buildName(style: NamingStyleId, subject: Subject, adjective: string, rng: Rng) {
  const S = subject.main
  switch (style) {
    case "short": {
      const base = subject.words.length > 1 && subject.words[0].length <= 7 ? subject.words[0] : S
      const name = cap(base.toLowerCase()).slice(0, 8)
      return { name, ticker: tickerize(name, 6) }
    }
    case "oneword": {
      const base = subject.words.length > 1 ? subject.compact : adjective.replace(/\s/g, "") + S
      const name = cap(base.toLowerCase())
      return { name, ticker: tickerize(name, 8) }
    }
    case "slang": {
      const name = `${subject.compact}${rng.pick(SUFFIXES.slang)}`
      return { name, ticker: tickerize(name, 8) }
    }
    case "phrase": {
      const name = fill(rng.pick(SUFFIXES.phrase), { S })
      const words = name.split(" ")
      const ticker = tickerize(words.slice(0, -1).map((w) => w[0]).join("") + words[words.length - 1], 8)
      return { name, ticker }
    }
    case "character": {
      const name = fill(rng.pick(SUFFIXES.character), { S })
      return { name, ticker: tickerize(name.replace(/^(Sir|Captain|Lil|Big|Professor|Agent|Lord)\s/, ""), 8) }
    }
    case "brand": {
      const suffix = rng.pick(SUFFIXES.brand)
      const name = rng.chance(0.5) ? `${subject.compact}${suffix.toLowerCase()}` : `${subject.compact} ${suffix}`
      return { name: cap(name), ticker: tickerize(subject.compact + suffix[0], 7) }
    }
    case "internet": {
      const suffix = rng.pick(SUFFIXES.internet)
      const name = `${subject.compact.toLowerCase()}${suffix}`
      return { name, ticker: tickerize(name, 8) }
    }
  }
}

export function generateConceptLocal(input: ConceptInput): MemeConcept {
  const seed = input.seed ?? randomSeed()
  const rng = createRng(seed)
  const subject = resolveSubject(input.topic, input.theme, rng)
  const personality = resolvePersonality(input.personality, rng)
  const bank = PERSONALITY_BANK[personality]
  const adjective = rng.pick(bank.adjectives)
  const { name, ticker } = buildName(input.namingStyle, subject, adjective, rng)
  const domain = toDomain(name)
  const traits = rng.pickMany(bank.traits, 3)
  const subjectLower = subject.text.toLowerCase()

  const vars: Record<string, string> = {
    Name: name,
    Ticker: `$${ticker}`,
    subject: subjectLower,
    Subject: subject.text,
    adj: adjective.toLowerCase(),
    Adj: adjective,
    trait: traits[0].toLowerCase(),
    vibe: bank.vibe,
    relatable: rng.pick(RELATABLE),
    goal: rng.pick(GOALS),
    hobby: rng.pick(HOBBIES),
    domain,
  }
  vars.catchphrase = fill(rng.pick(CATCHPHRASES), vars)
  // For quoting mid-sentence: no trailing period ("said \"No thoughts\" and...").
  vars.catchBare = vars.catchphrase.replace(/[.!]+$/, "")

  const tagline = fill(
    rng.pick([
      "The internet's most {trait} {subject}.",
      "A {trait} {subject} with main-character energy.",
      "{Adj} {subject} energy, served daily.",
      "The {subject} your group chat didn't know it needed.",
      "Part {subject}, part meme, fully {trait}.",
    ]),
    vars,
  )

  const palette = rng.pick(bank.palettes)
  const logoConcept = `${cap(vars.adj)} ${subjectLower} mascot wearing ${rng.pick(LOGO_PROPS)}, ${rng.pick(
    LOGO_SCENES,
  )}, ${rng.pick(LOGO_STYLES)}. Palette: ${palette
    .slice(0, 3)
    .map((c) => c.name.toLowerCase())
    .join(", ")}.`

  const lore = LORE_TITLES.map((title, i) => ({
    title,
    text: [
      fill("A {subject} appears in a screenshot nobody can explain. The first {Name} meme is posted.", vars),
      fill("Meme creators start remixing it. Stickers, edits and reaction images spread across group chats.", vars),
      fill("The community invents inside jokes, fan art and the official catchphrase: \"{catchBare}\".", vars),
      fill("{Name} becomes the internet's go-to reaction for anything {trait}. The lore is still being written.", vars),
    ][i],
  }))

  const concept: MemeConcept = {
    id: uid("idea"),
    createdAt: new Date().toISOString(),
    input: { ...input, seed },
    source: "local",
    name,
    ticker,
    domain,
    tagline,
    traits,
    originStory: fill(rng.pick(ORIGIN_TEMPLATES), vars),
    slogan: fill(rng.pick(SLOGAN_TEMPLATES), vars),
    catchphrase: vars.catchphrase,
    communityPhrases: rng.pickMany(COMMUNITY_PHRASES, 3).map((p) => fill(p, vars)),
    logoConcept,
    mascot: subject.emoji,
    palette,
    socialBio: `${subject.emoji} ${fill("The internet's most {trait} {subject}.", vars)}\n✨ Powered by ${rng.pick(["naps", "snacks", "chaos", "vibes", "drama", "memes"])} & ${rng.pick(["sarcasm", "sparkles", "bad decisions", "group chats"])}.\n🌐 ${domain}`,
    websiteHeadline: fill(rng.pick(["The internet's favorite {trait} {subject}.", "Meet {Name}.", "{Name} has entered the chat."]), vars),
    websiteDescription: fill(
      "{Name} is a meme character who is {vibe}. Come for the memes, stay for the lore, leave with a new favorite reaction image.",
      vars,
    ),
    memeIdeas: rng.pickMany(MEME_TEMPLATES, 5).map((t) => fill(t, vars)),
    launchIdeas: rng.pickMany(LAUNCH_IDEAS, 5).map((t) => fill(t, vars)),
    lore,
  }
  return sanitizeDeep(concept)
}

export function labelFor<T extends { id: string; label: string }>(list: readonly T[], id: string) {
  return list.find((x) => x.id === id)?.label ?? id
}

export const themeLabel = (id: ThemeId) => labelFor(THEMES, id)
export const personalityLabel = (id: PersonalityId) => labelFor(PERSONALITIES, id)
export const namingLabel = (id: NamingStyleId) => labelFor(NAMING_STYLES, id)
