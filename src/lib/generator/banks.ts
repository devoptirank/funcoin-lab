import type { PaletteColor, PersonalityId, ThemeId } from "@/lib/types"

type Subject = { word: string; emoji: string }

export const THEME_SUBJECTS: Record<Exclude<ThemeId, "custom" | "random">, Subject[]> = {
  animals: [
    { word: "Cat", emoji: "🐱" },
    { word: "Dog", emoji: "🐶" },
    { word: "Frog", emoji: "🐸" },
    { word: "Capybara", emoji: "🦫" },
    { word: "Goose", emoji: "🪿" },
    { word: "Hamster", emoji: "🐹" },
    { word: "Penguin", emoji: "🐧" },
    { word: "Otter", emoji: "🦦" },
    { word: "Sloth", emoji: "🦥" },
    { word: "Duck", emoji: "🦆" },
    { word: "Raccoon", emoji: "🦝" },
    { word: "Shiba", emoji: "🐕" },
  ],
  food: [
    { word: "Banana", emoji: "🍌" },
    { word: "Pizza", emoji: "🍕" },
    { word: "Taco", emoji: "🌮" },
    { word: "Noodle", emoji: "🍜" },
    { word: "Donut", emoji: "🍩" },
    { word: "Avocado", emoji: "🥑" },
    { word: "Nugget", emoji: "🍗" },
    { word: "Pickle", emoji: "🥒" },
    { word: "Burrito", emoji: "🌯" },
    { word: "Waffle", emoji: "🧇" },
  ],
  ai: [
    { word: "Robot", emoji: "🤖" },
    { word: "Bot", emoji: "🤖" },
    { word: "Neuron", emoji: "🧠" },
    { word: "Prompt", emoji: "💬" },
    { word: "Pixel", emoji: "👾" },
    { word: "Chip", emoji: "💾" },
    { word: "Cyborg", emoji: "🦾" },
    { word: "Glitch", emoji: "📟" },
  ],
  internet: [
    { word: "Doge", emoji: "🐕" },
    { word: "Wojak", emoji: "😐" },
    { word: "Chad", emoji: "🗿" },
    { word: "Npc", emoji: "🧍" },
    { word: "Lurker", emoji: "👀" },
    { word: "Shitpost", emoji: "💩" },
    { word: "Ratio", emoji: "📉" },
    { word: "Vibe", emoji: "✨" },
    { word: "Copium", emoji: "🫁" },
    { word: "Meme", emoji: "🤡" },
  ],
  gaming: [
    { word: "Noob", emoji: "🎮" },
    { word: "Boss", emoji: "👹" },
    { word: "Respawn", emoji: "♻️" },
    { word: "Lag", emoji: "🐌" },
    { word: "Loot", emoji: "🎁" },
    { word: "Speedrun", emoji: "⏱️" },
    { word: "Pixel", emoji: "👾" },
    { word: "Goblin", emoji: "👺" },
  ],
  space: [
    { word: "Alien", emoji: "👽" },
    { word: "Astronaut", emoji: "🧑‍🚀" },
    { word: "Moon", emoji: "🌙" },
    { word: "Comet", emoji: "☄️" },
    { word: "Ufo", emoji: "🛸" },
    { word: "Martian", emoji: "👾" },
    { word: "Nebula", emoji: "🌌" },
    { word: "Saturn", emoji: "🪐" },
  ],
  culture: [
    { word: "Office Worker", emoji: "💼" },
    { word: "Landlord", emoji: "🏠" },
    { word: "Barista", emoji: "☕" },
    { word: "Intern", emoji: "🧑‍💻" },
    { word: "Gym Bro", emoji: "🏋️" },
    { word: "Grandma", emoji: "👵" },
    { word: "Influencer", emoji: "🤳" },
    { word: "Monday", emoji: "📅" },
  ],
  indian: [
    { word: "Chai", emoji: "☕" },
    { word: "Jugaad", emoji: "🔧" },
    { word: "Rickshaw", emoji: "🛺" },
    { word: "Samosa", emoji: "🥟" },
    { word: "Cricket", emoji: "🏏" },
    { word: "Biryani", emoji: "🍛" },
    { word: "Uncle", emoji: "👨‍🦳" },
    { word: "Bollywood", emoji: "🎬" },
  ],
  desi: [
    { word: "Desi Mom", emoji: "🩴" },
    { word: "Chappal", emoji: "🩴" },
    { word: "Rishta Aunty", emoji: "💍" },
    { word: "Pani Puri", emoji: "🥙" },
    { word: "Ladoo", emoji: "🟠" },
    { word: "Shaadi", emoji: "🎊" },
    { word: "Tiffin", emoji: "🍱" },
    { word: "Jalebi", emoji: "🥨" },
  ],
}

/** Keyword → mascot emoji for free-text topics. Checked in order, first match wins. */
export const KEYWORD_EMOJI: [RegExp, string][] = [
  [/cat|kitt|meow|purr/i, "🐱"],
  [/dog|pup|doge|shib/i, "🐶"],
  [/frog|pepe/i, "🐸"],
  [/banana/i, "🍌"],
  [/chai|tea/i, "☕"],
  [/coffee|latte|barista/i, "☕"],
  [/alien|ufo|martian/i, "👽"],
  [/robot|\bai\b|bot|gpt|android/i, "🤖"],
  [/football|soccer/i, "⚽"],
  [/basket/i, "🏀"],
  [/cricket/i, "🏏"],
  [/office|work|boss|corporate|9.?to.?5/i, "💼"],
  [/pizza/i, "🍕"],
  [/taco/i, "🌮"],
  [/burger/i, "🍔"],
  [/donut|doughnut/i, "🍩"],
  [/moon|lunar/i, "🌙"],
  [/rocket|space|astro/i, "🚀"],
  [/penguin/i, "🐧"],
  [/duck/i, "🦆"],
  [/goose/i, "🪿"],
  [/monkey|ape|chimp/i, "🐵"],
  [/bear/i, "🐻"],
  [/hamster/i, "🐹"],
  [/fish|shark/i, "🦈"],
  [/dragon/i, "🐉"],
  [/unicorn/i, "🦄"],
  [/ghost|spooky/i, "👻"],
  [/clown/i, "🤡"],
  [/wizard|magic/i, "🧙"],
  [/ninja/i, "🥷"],
  [/pirate/i, "🏴‍☠️"],
  [/game|gamer|noob/i, "🎮"],
  [/internet|meme|online/i, "🌐"],
  [/potato/i, "🥔"],
  [/avocado/i, "🥑"],
  [/cheese/i, "🧀"],
  [/egg/i, "🥚"],
  [/cookie/i, "🍪"],
  [/samosa/i, "🥟"],
  [/biryani|curry/i, "🍛"],
  [/mom|mum|mother/i, "👩"],
  [/grandma|granny/i, "👵"],
  [/rain|cloud/i, "🌧️"],
  [/sun|summer/i, "☀️"],
]

/** Mood words only decide the mascot when no subject noun matched ("Angry Penguin" → 🐧). */
export const MOOD_EMOJI: [RegExp, string][] = [
  [/sleep|nap|snooz|tired|lazy/i, "😴"],
  [/angry|rage|mad/i, "😤"],
  [/fire|hot|spicy/i, "🌶️"],
  [/skull|dead/i, "💀"],
  [/king|queen|royal/i, "👑"],
]

export const FALLBACK_EMOJI = ["🤡", "✨", "🫠", "🦄", "🐸", "👾", "🍌", "🌀"]

type PersonalityBank = {
  adjectives: string[]
  traits: string[]
  vibe: string
  palettes: PaletteColor[][]
}

export const PERSONALITY_BANK: Record<Exclude<PersonalityId, "random">, PersonalityBank> = {
  cute: {
    adjectives: ["Smol", "Fluffy", "Tiny", "Baby", "Sleepy", "Bubbly", "Snuggly"],
    traits: ["Cute", "Soft", "Snuggly", "Shy", "Sparkly", "Clumsy"],
    vibe: "adorably harmless",
    palettes: [
      [
        { name: "Cotton Candy", hex: "#FF8FD8" },
        { name: "Baby Blue", hex: "#8FD3FF" },
        { name: "Butter", hex: "#FFE38F" },
        { name: "Lilac", hex: "#C9A7FF" },
        { name: "Midnight", hex: "#14101F" },
      ],
      [
        { name: "Peach Fuzz", hex: "#FFB38A" },
        { name: "Mint Milk", hex: "#9BF6D0" },
        { name: "Bubblegum", hex: "#FF6FB5" },
        { name: "Cream", hex: "#FFF4E0" },
        { name: "Cocoa", hex: "#2A1A1F" },
      ],
    ],
  },
  chaotic: {
    adjectives: ["Feral", "Unhinged", "Turbo", "Mega", "Rogue", "Hyper", "Wild"],
    traits: ["Chaotic", "Loud", "Unpredictable", "Hyperactive", "Feral", "Fearless"],
    vibe: "pure chaos with a heart of gold",
    palettes: [
      [
        { name: "Toxic Lime", hex: "#B6FF2E" },
        { name: "Hazard Pink", hex: "#FF2E88" },
        { name: "Electric Violet", hex: "#8B2EFF" },
        { name: "Cone Orange", hex: "#FF8A00" },
        { name: "Void", hex: "#0A0710" },
      ],
    ],
  },
  absurd: {
    adjectives: ["Quantum", "Accidental", "Inflatable", "Upside-Down", "Haunted", "Philosophical"],
    traits: ["Absurd", "Surreal", "Confusing", "Dramatic", "Mysterious", "Nonsensical"],
    vibe: "completely nonsensical, and proud of it",
    palettes: [
      [
        { name: "Dream Teal", hex: "#2EF2D0" },
        { name: "Melted Clock", hex: "#FFB627" },
        { name: "Surreal Pink", hex: "#FF5EAE" },
        { name: "Deep Purple", hex: "#5B2EFF" },
        { name: "Night Ink", hex: "#0D0B1A" },
      ],
    ],
  },
  funny: {
    adjectives: ["Silly", "Goofy", "Wobbly", "Derpy", "Giggly", "Bonkers"],
    traits: ["Funny", "Goofy", "Lovable", "Clumsy", "Witty", "Dramatic"],
    vibe: "the class clown of the internet",
    palettes: [
      [
        { name: "Sunny Yellow", hex: "#FFD60A" },
        { name: "Clown Red", hex: "#FF4D4D" },
        { name: "Sky Pop", hex: "#3DB2FF" },
        { name: "Grass Green", hex: "#4ADE80" },
        { name: "Ink", hex: "#111018" },
      ],
    ],
  },
  luxury: {
    adjectives: ["Royal", "Golden", "Velvet", "Platinum", "Sir", "Gilded", "Diamond"],
    traits: ["Luxurious", "Fancy", "Dramatic", "Refined", "Extra", "Iconic"],
    vibe: "overdressed for every occasion",
    palettes: [
      [
        { name: "24K Gold", hex: "#F5C451" },
        { name: "Champagne", hex: "#F3E3C3" },
        { name: "Royal Purple", hex: "#6D28D9" },
        { name: "Emerald", hex: "#10B981" },
        { name: "Onyx", hex: "#0B0A0F" },
      ],
    ],
  },
  genz: {
    adjectives: ["Delulu", "NoCap", "Slay", "Lowkey", "Rizz", "Bussin", "Main Character"],
    traits: ["Gen-Z", "Iconic", "Unbothered", "Chronically Online", "Ironic", "Slay"],
    vibe: "chronically online and thriving",
    palettes: [
      [
        { name: "Brat Green", hex: "#8ACE00" },
        { name: "Y2K Pink", hex: "#FF4FD8" },
        { name: "Chrome", hex: "#C9D1E0" },
        { name: "Cyber Blue", hex: "#2EC5FF" },
        { name: "Blackout", hex: "#0A0A0A" },
      ],
    ],
  },
  weird: {
    adjectives: ["Cursed", "Glitched", "Moist", "Sus", "Liminal", "Eldritch"],
    traits: ["Weird", "Cryptic", "Uncanny", "Mysterious", "Quirky", "Slightly Cursed"],
    vibe: "slightly cursed, deeply loved",
    palettes: [
      [
        { name: "Swamp", hex: "#7CFC8A" },
        { name: "Bruise", hex: "#7B3FE4" },
        { name: "Static", hex: "#E5E5E5" },
        { name: "Warning", hex: "#FFE600" },
        { name: "Backrooms", hex: "#151208" },
      ],
    ],
  },
  aggressive: {
    adjectives: ["Angry", "Raging", "Savage", "Alpha", "Furious", "Grumpy"],
    traits: ["Intense", "Loud", "Competitive", "Grumpy", "Fearless", "Unstoppable"],
    vibe: "permanently annoyed, weirdly motivating",
    palettes: [
      [
        { name: "Rage Red", hex: "#FF2E2E" },
        { name: "Molten", hex: "#FF8A00" },
        { name: "Steel", hex: "#9CA3AF" },
        { name: "Volt", hex: "#E9FF2E" },
        { name: "Pitch", hex: "#0B0707" },
      ],
    ],
  },
  wholesome: {
    adjectives: ["Kind", "Comfy", "Cozy", "Happy", "Gentle", "Sunny"],
    traits: ["Wholesome", "Kind", "Supportive", "Cozy", "Optimistic", "Friendly"],
    vibe: "the internet's emotional support meme",
    palettes: [
      [
        { name: "Sunrise", hex: "#FFB86B" },
        { name: "Meadow", hex: "#7EE081" },
        { name: "Sky", hex: "#7CC6FF" },
        { name: "Blush", hex: "#FF9EC4" },
        { name: "Hearth", hex: "#1A1410" },
      ],
    ],
  },
}

export const ORIGIN_TEMPLATES = [
  "{Name} started as a blurry photo of a {subject} posted at 3:07 AM with the caption \"{catchBare}\". Nobody knows who posted it. By sunrise it had been remixed, stickered and turned into a reaction image in a thousand group chats. Today {Name} is {vibe}, a mascot for everyone who has ever {relatable}.",
  "Legend says {Name} was the result of a typo. Someone tried to search for \"{subject} pictures\" and the algorithm served something far stranger. The internet adopted it immediately. {Name} is {vibe}, and its only known goal is {goal}.",
  "Long ago, in a forgotten forum thread, a {subject} appeared in the background of someone's screenshot. It wasn't supposed to be there. One zoom-in later, {Name} was born. It is {vibe}, it has never explained itself, and it never will.",
  "{Name} was drawn on a napkin during a very long meeting about nothing. The doodle (a {subject} with way too much attitude) escaped the napkin, then the office, then the internet. Now it is {vibe} and spends its days {hobby}.",
  "Scientists can't explain {Name}. Historians refuse to try. All we know is that one day a {subject} looked into a webcam, said \"{catchBare}\" and the internet was never the same. It is {vibe}.",
]

export const RELATABLE = [
  "hit snooze five times",
  "opened the fridge just to stare",
  "replied 'lol' with a straight face",
  "pretended to understand the group chat",
  "survived a Monday",
  "said 'one more episode' and lied",
  "joined a meeting with the camera off",
]

export const GOALS = [
  "making strangers laugh in the group chat",
  "becoming the most-shared sticker on the internet",
  "getting a fan art wall that never ends",
  "being the reaction image for every situation",
  "collecting the world's largest library of remixes",
]

export const HOBBIES = [
  "napping on keyboards",
  "photobombing other memes",
  "speedrunning bad decisions",
  "posting cryptic emojis",
  "starting dance trends nobody asked for",
  "rating snacks out of 10",
]

export const SLOGAN_TEMPLATES = [
  "Too {adj} to be serious. Too {trait} to quit.",
  "Do less. Meme more.",
  "Born online. Raised by memes.",
  "One {subject}. Infinite vibes.",
  "Certified {trait}. Zero explanation.",
  "We don't make sense. We make memes.",
  "Stay {adj}. Stay weird. Stay {Name}.",
  "The {subject} the internet deserves.",
]

export const CATCHPHRASES = [
  "Wake me when it's fun.",
  "No thoughts. Just vibes.",
  "It's giving {subject}.",
  "I am the meme now.",
  "Absolutely not. Anyway…",
  "Chaos is a love language.",
  "Snacks first, questions later.",
  "Built different. Slightly broken.",
  "We ride at dawn. Or after lunch.",
]

export const COMMUNITY_PHRASES = [
  "Stay {adj}.",
  "Do less. Meme more.",
  "Wake me when it's fun.",
  "{Ticker} gang, assemble.",
  "Post the meme, not the drama.",
  "Good vibes only. Bad puns encouraged.",
  "Remix everything.",
  "Be nice. Be weird. Be {Name}.",
  "One of us. One of us.",
]

export const LOGO_STYLES = [
  "thick cartoon outlines, bold meme aesthetic, sticker-ready",
  "flat vector mascot, chunky shapes, high contrast",
  "retro 90s cartoon style with halftone shading",
  "glossy 3D toy look with soft studio lighting",
  "hand-drawn doodle style, slightly wobbly lines",
  "pixel-art badge, 32-bit arcade energy",
]

export const LOGO_PROPS = [
  "oversized sunglasses",
  "a tiny crown",
  "a backwards cap",
  "a glowing halo",
  "a sleeping mask",
  "a party hat",
  "headphones",
  "a cape",
  "a monocle",
  "a gold chain",
  "a bandana",
]

export const LOGO_SCENES = [
  "curled around a crescent moon",
  "bursting out of a circular badge",
  "surfing a giant emoji wave",
  "sitting on a stack of memes",
  "floating in a ring of sparkles",
  "peeking over the edge of the frame",
]

export const MEME_TEMPLATES = [
  "Me after saying \"just one more meme\" three hours ago.",
  "{Name} when the group chat finally goes quiet: 😌",
  "Nobody: … {Name}: {catchphrase}",
  "POV: you explained {Name} to your parents.",
  "{Name} when Monday says hi.",
  "Me checking the group chat after saying I'd log off.",
  "When the {subject} memes hit different at 2 AM.",
  "{Name} trying to be productive for exactly 4 minutes.",
  "That moment you realize you're the main character of the {Name} lore.",
  "Starter pack: {Name} enjoyer.",
  "{Name} reading the comments like 🍿",
  "Expectation: calm. Reality: {Name}.",
]

export const LAUNCH_IDEAS = [
  "Mascot reveal teaser: a 3-second silhouette clip with the caption \"something {adj} is coming\".",
  "Lore drop thread: tell the {Name} origin story in five chaotic posts.",
  "Meme contest: best {Name} remix gets pinned on the website for a week.",
  "Sticker pack drop for Telegram and Discord with 10 mascot expressions.",
  "Fan Art Friday: repost community drawings every week.",
  "\"Explain {Name} badly\" challenge on TikTok.",
  "Countdown posts featuring the mascot doing increasingly unhinged things.",
  "Website launch post: a screen recording tour of {domain}.",
  "Community poll: what should {Name} do next in the lore?",
  "Behind-the-memes post showing early logo sketches.",
]

export const LORE_TITLES = [
  "Born on the internet",
  "Discovered by meme creators",
  "The community goes wild",
  "The legend grows",
]

export const SUFFIXES = {
  domain: ["", "coin", "club", "meme", "gang", "world", "lol", "hq", "verse", "land", "party", "zone", "fam", "army", "nation"],
  slang: ["Chad", "Bro", "Gang", "King", "Boss", "Lord", "Squad"],
  brand: ["Corp", "Industries", "Labs", "Co", "Inc", "Global", "Group"],
  internet: [".exe", "GPT", "404", "OS", "_irl", "2000", "HD"],
  character: ["Sir {S}alot", "Captain {S}", "Lil {S}", "Big {S}", "{S} McFluff", "Professor {S}", "Agent {S}", "Lord {S}ington"],
  phrase: ["No Thoughts Just {S}", "Just A {S}", "{S} Did Nothing Wrong", "Wen {S}", "{S} Is Fine", "Trust The {S}", "{S} Was Here", "It's Always {S}"],
}
