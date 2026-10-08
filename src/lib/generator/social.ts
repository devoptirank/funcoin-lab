import type { ContentTypeId, MemeConcept, SocialBios, SocialPlatform } from "@/lib/types"
import { sanitizeDeep } from "@/lib/safety"
import { createRng, randomSeed } from "./random"
import { fill, tickerize, toDomain } from "./text"

type BioSource = Pick<MemeConcept, "name" | "ticker" | "domain" | "mascot" | "tagline" | "catchphrase" | "slogan" | "traits">

function varsFor(c: BioSource): Record<string, string> {
  // Standalone tools may pass partial brands; never leave holes in the copy.
  return {
    Name: c.name,
    Ticker: `$${c.ticker || tickerize(c.name)}`,
    domain: c.domain || toDomain(c.name),
    tagline: c.tagline || `The internet's favorite ${c.name}.`,
    catchphrase: c.catchphrase || "No thoughts. Just vibes.",
    slogan: c.slogan || "Do less. Meme more.",
    trait: (c.traits[0] ?? "chaotic").toLowerCase(),
    trait2: (c.traits[1] ?? "funny").toLowerCase(),
  }
}

export function generateSocialBiosLocal(c: BioSource): SocialBios {
  const v = varsFor(c)
  return sanitizeDeep({
    x: fill("{tagline}\n{catchphrase}\n{domain}", v),
    telegram: fill(
      "Welcome to the official {Name} community.\n\nShare memes, remix the mascot, invent the lore. Be kind, be weird, no spam.\n\nWebsite: {domain}\nNot financial advice. Always verify links and contract addresses here.",
      v,
    ),
    discord: fill(
      "{Name}: {tagline}\n\n#memes for your best edits, #lore for canon debates, #fan-art for the masterpieces. {slogan}",
      v,
    ),
    instagram: fill("{Name}\n{tagline}\nDaily memes and mascot chaos\n{domain}", v),
    tiktok: fill("{Name} | {trait} memes daily\n{catchphrase}\n{domain}", v),
  })
}

const CONTENT_TEMPLATES: Record<ContentTypeId, string[]> = {
  caption: [
    "me pretending I have my life together",
    "{Name} after one (1) productive minute:",
    "nobody:\n{Name}: {catchphrase}",
    "this is a {trait} household",
    "POV: the {Name} lore just got weirder",
    "{Name} reacting to the group chat at 3 AM",
  ],
  announcement: [
    "{Name} has officially entered the chat. Website: {domain}. Bring memes.",
    "BIG NEWS The {Name} meme gallery is live. Submit your best remix.",
    "The {Name} sticker pack is here. 10 moods. 0 chill.",
    "New lore chapter unlocked. {Name} did something {trait}. Read it on {domain}.",
  ],
  community: [
    "Drop your best {Name} meme below Top 3 get featured on the site this week.",
    "Roll call What's your {Name} mood today? Reply with an emoji.",
    "Reminder: {slogan} Be kind, post memes, keep it weird.",
    "Fan Art Friday is ON. Show us your {Name} masterpieces",
  ],
  quote: [
    "\"{catchphrase}\" - {Name}, probably",
    "\"I'm not {trait}, I'm just ahead of the meme.\" - {Name}",
    "\"Today I choose violence. Tomorrow I choose naps.\"",
    "\"Every great meme starts with a bad idea.\" - {Name}",
  ],
  teaser: [
    "something {trait} is loading…",
    "Coming soon: {domain}",
    "3… 2…",
    "You're not ready for {Name}. Honestly, neither are we.",
  ],
  lore: [
    "{Name} lore, chapter 1: it all started with one weird screenshot…",
    "Lore fact: {Name} has never once explained itself. {catchphrase}",
    "Historians agree: the {Name} meme timeline is 90% vibes and 10% chaos",
    "The legend of {Name}: {tagline}",
  ],
}

const PLATFORM_FLAVOR: Record<SocialPlatform, (s: string, v: Record<string, string>) => string> = {
  x: (s) => s,
  instagram: (s, v) => `${s}\n\n#memes #${v.Name.replace(/\W/g, "").toLowerCase()} #funny`,
  tiktok: (s, v) => `${s} #fyp #${v.Name.replace(/\W/g, "").toLowerCase()}`,
  telegram: (s) => s,
  discord: (s) => s.replace(/^/, "@everyone "),
}

export function generateContentLocal(
  c: BioSource,
  platform: SocialPlatform,
  type: ContentTypeId,
  count = 4,
  seed = randomSeed(),
): string[] {
  const rng = createRng(seed)
  const v = varsFor(c)
  const picks = rng.pickMany(CONTENT_TEMPLATES[type], Math.min(count, CONTENT_TEMPLATES[type].length))
  return sanitizeDeep(picks.map((t) => PLATFORM_FLAVOR[platform](fill(t, v), v)))
}
