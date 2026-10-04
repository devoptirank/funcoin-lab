import type { NamingStyleId, PersonalityId, ThemeId } from "@/lib/types"

// The FunCoin Universe: curated example brands. No prices, caps, volume or holders —
// on purpose. "trending" is an editorial order, not a market signal.

export type DiscoverTag = "cute" | "chaotic" | "animals" | "ai" | "food" | "space" | "desi" | "internet" | "luxury" | "wholesome"

export type DiscoverProject = {
  slug: string
  name: string
  ticker: string
  domain: string
  mascot: string
  personality: string[]
  tags: DiscoverTag[]
  description: string
  headline: string
  colors: [string, string, string, string]
  addedAt: string
  editorsPick: number
  remix: { topic: string; theme: ThemeId; personality: PersonalityId; namingStyle: NamingStyleId }
}

export const DISCOVER_PROJECTS: DiscoverProject[] = [
  {
    slug: "sleepy",
    name: "Sleepy",
    ticker: "SLEEPY",
    domain: "sleepy.fun",
    mascot: "😴",
    personality: ["Lazy", "Cute", "Chaotic"],
    tags: ["cute", "animals"],
    description: "The internet's laziest cat. Naps professionally, memes recreationally.",
    headline: "Too tired to be serious.",
    colors: ["#C9A7FF", "#8FD3FF", "#FFE38F", "#14101F"],
    addedAt: "2026-09-28",
    editorsPick: 1,
    remix: { topic: "Sleepy Cat", theme: "animals", personality: "cute", namingStyle: "short" },
  },
  {
    slug: "banana",
    name: "Banana Boss",
    ticker: "BANANA",
    domain: "banana.fun",
    mascot: "🍌",
    personality: ["Funny", "Bossy", "Slippery"],
    tags: ["food", "chaotic"],
    description: "A banana in a tiny suit who runs every meeting and approves nothing.",
    headline: "Peel the vibes.",
    colors: ["#FFD60A", "#FF4D4D", "#3DB2FF", "#111018"],
    addedAt: "2026-09-26",
    editorsPick: 3,
    remix: { topic: "Banana Boss", theme: "food", personality: "funny", namingStyle: "character" },
  },
  {
    slug: "alien",
    name: "Alien Bro",
    ticker: "ALIEN",
    domain: "alien.fun",
    mascot: "👽",
    personality: ["Weird", "Friendly", "Lost"],
    tags: ["space", "internet"],
    description: "Came to Earth for research. Stayed for the memes and the free Wi-Fi.",
    headline: "Take me to your group chat.",
    colors: ["#7CFC8A", "#7B3FE4", "#E5E5E5", "#0D0B1A"],
    addedAt: "2026-09-24",
    editorsPick: 2,
    remix: { topic: "Alien", theme: "space", personality: "weird", namingStyle: "slang" },
  },
  {
    slug: "chad",
    name: "Chai Chad",
    ticker: "CHAD",
    domain: "chad.fun",
    mascot: "☕",
    personality: ["Confident", "Desi", "Warm"],
    tags: ["desi", "food"],
    description: "Brews chai at 4 PM sharp. Refuses to discuss coffee. Ever.",
    headline: "Chai first. Everything else later.",
    colors: ["#FFB86B", "#C2410C", "#FDE68A", "#1A1410"],
    addedAt: "2026-09-29",
    editorsPick: 4,
    remix: { topic: "Chai", theme: "indian", personality: "genz", namingStyle: "slang" },
  },
  {
    slug: "moondog",
    name: "Moondog",
    ticker: "MOONDOG",
    domain: "moondog.fun",
    mascot: "🐶",
    personality: ["Dreamy", "Loyal", "Goofy"],
    tags: ["animals", "space", "cute"],
    description: "A good boy who howls at the moon because he thinks it's a giant tennis ball.",
    headline: "Ball is life. Moon is ball.",
    colors: ["#8FD3FF", "#C9A7FF", "#FFF4E0", "#0B1020"],
    addedAt: "2026-09-20",
    editorsPick: 5,
    remix: { topic: "Moon Dog", theme: "animals", personality: "wholesome", namingStyle: "oneword" },
  },
  {
    slug: "sleepyai",
    name: "SleepyAI",
    ticker: "SLPYAI",
    domain: "sleepyai.fun",
    mascot: "🤖",
    personality: ["Sleepy", "Smart", "Glitchy"],
    tags: ["ai", "cute"],
    description: "An AI that answers every question with a yawn and a surprisingly good haiku.",
    headline: "Processing… please wait 8 hours.",
    colors: ["#2EC5FF", "#C9D1E0", "#FF4FD8", "#0A0A0A"],
    addedAt: "2026-09-30",
    editorsPick: 6,
    remix: { topic: "Sleepy AI Robot", theme: "ai", personality: "absurd", namingStyle: "internet" },
  },
  {
    slug: "frogking",
    name: "Frog King",
    ticker: "FROGK",
    domain: "frogking.fun",
    mascot: "🐸",
    personality: ["Royal", "Dramatic", "Damp"],
    tags: ["animals", "luxury"],
    description: "Rules a single lily pad with an iron webbed fist and a velvet cape.",
    headline: "Kneel before the pond.",
    colors: ["#F5C451", "#10B981", "#6D28D9", "#0B0A0F"],
    addedAt: "2026-09-18",
    editorsPick: 8,
    remix: { topic: "Frog King", theme: "animals", personality: "luxury", namingStyle: "character" },
  },
  {
    slug: "gooseglitch",
    name: "goose.exe",
    ticker: "GOOSEEXE",
    domain: "gooseexe.fun",
    mascot: "🪿",
    personality: ["Chaotic", "Loud", "Unstoppable"],
    tags: ["animals", "chaotic", "internet"],
    description: "A goose that escaped a video game and now honks at your browser tabs.",
    headline: "HONK has entered the chat.",
    colors: ["#B6FF2E", "#FF2E88", "#8B2EFF", "#0A0710"],
    addedAt: "2026-09-27",
    editorsPick: 7,
    remix: { topic: "Goose", theme: "internet", personality: "chaotic", namingStyle: "internet" },
  },
  {
    slug: "samosasquad",
    name: "Samosa Squad",
    ticker: "SAMOSA",
    domain: "samosasquad.fun",
    mascot: "🥟",
    personality: ["Crunchy", "Wholesome", "Spicy"],
    tags: ["desi", "food", "wholesome"],
    description: "Three samosas who solve every problem with extra chutney and group hugs.",
    headline: "Crispy outside. Soft inside.",
    colors: ["#FFB627", "#7EE081", "#FF5EAE", "#1A1208"],
    addedAt: "2026-09-22",
    editorsPick: 9,
    remix: { topic: "Samosa", theme: "desi", personality: "wholesome", namingStyle: "slang" },
  },
  {
    slug: "capybro",
    name: "Capybro",
    ticker: "CAPY",
    domain: "capybro.fun",
    mascot: "🦫",
    personality: ["Chill", "Unbothered", "Kind"],
    tags: ["animals", "wholesome", "cute"],
    description: "Sits in hot springs. Befriends everyone. Has never once been stressed.",
    headline: "Okay I pull up.",
    colors: ["#FFB38A", "#9BF6D0", "#FF6FB5", "#2A1A1F"],
    addedAt: "2026-09-15",
    editorsPick: 10,
    remix: { topic: "Capybara", theme: "animals", personality: "wholesome", namingStyle: "slang" },
  },
  {
    slug: "pizzalord",
    name: "Lord Pizzington",
    ticker: "PIZZA",
    domain: "pizzington.fun",
    mascot: "🍕",
    personality: ["Luxury", "Cheesy", "Extra"],
    tags: ["food", "luxury"],
    description: "A pizza slice with a monocle who only attends galas that serve ranch.",
    headline: "Extra cheese is a lifestyle.",
    colors: ["#F5C451", "#FF4D4D", "#F3E3C3", "#130B07"],
    addedAt: "2026-09-12",
    editorsPick: 12,
    remix: { topic: "Pizza", theme: "food", personality: "luxury", namingStyle: "character" },
  },
  {
    slug: "npcgpt",
    name: "NpcGPT",
    ticker: "NPCGPT",
    domain: "npcgpt.fun",
    mascot: "🧍",
    personality: ["Repetitive", "Absurd", "Polite"],
    tags: ["ai", "internet", "chaotic"],
    description: "An AI that only knows three lines of dialogue and uses them with confidence.",
    headline: "Nice weather we're having.",
    colors: ["#2EF2D0", "#FFB627", "#5B2EFF", "#0D0B1A"],
    addedAt: "2026-09-25",
    editorsPick: 11,
    remix: { topic: "NPC", theme: "ai", personality: "absurd", namingStyle: "internet" },
  },
]

export const DISCOVER_FILTERS = [
  { id: "newest", label: "Newest" },
  { id: "trending", label: "Trending" },
  { id: "random", label: "Random" },
  { id: "cute", label: "Cute" },
  { id: "chaotic", label: "Chaotic" },
  { id: "animals", label: "Animals" },
  { id: "ai", label: "AI" },
  { id: "food", label: "Food" },
] as const
export type DiscoverFilter = (typeof DISCOVER_FILTERS)[number]["id"]

export function remixHref(p: DiscoverProject) {
  const q = new URLSearchParams({ topic: p.remix.topic, theme: p.remix.theme, personality: p.remix.personality, style: p.remix.namingStyle })
  return `/create?${q.toString()}`
}

export const HERO_EXAMPLES = [
  { ticker: "MOONDOG", domain: "moondog.fun", mascot: "🐶", line: "Howls at the moon. Thinks it's a tennis ball." },
  { ticker: "BANANABOSS", domain: "bananaboss.fun", mascot: "🍌", line: "Runs every meeting. Approves nothing." },
  { ticker: "SLEEPYAI", domain: "sleepyai.fun", mascot: "🤖", line: "Answers in yawns and haikus." },
  { ticker: "CHAICHAD", domain: "chaichad.fun", mascot: "☕", line: "4 PM chai. Non-negotiable." },
  { ticker: "ALIENBRO", domain: "alienbro.fun", mascot: "👽", line: "Came for research. Stayed for memes." },
]
