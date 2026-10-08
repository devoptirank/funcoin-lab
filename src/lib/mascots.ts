// Mascot library: one AI-generated, transparent character image per common meme subject.
// Generated concepts pick a mascot here by keyword, so every coin has real artwork (no emojis)
// without generating images per user. Files live in /public/mascots/<key>.webp.

export type MascotDef = { key: string; label: string; subject: string; match?: RegExp; object?: boolean }

export const MASCOTS: MascotDef[] = [
  // Animals
  { key: "cat", label: "Cat", subject: "an orange tabby cat", match: /cat|kitt|meow|purr/i },
  { key: "dog", label: "Dog", subject: "a shiba inu dog", match: /dog|pup|doge|shib|woof/i },
  { key: "frog", label: "Frog", subject: "an original green frog (not resembling any existing meme character)", match: /frog|toad/i },
  { key: "capybara", label: "Capybara", subject: "a chill capybara", match: /capy/i },
  { key: "goose", label: "Goose", subject: "a white goose", match: /goose|honk/i },
  { key: "hamster", label: "Hamster", subject: "a chubby hamster", match: /hamster/i },
  { key: "penguin", label: "Penguin", subject: "a penguin", match: /penguin/i },
  { key: "otter", label: "Otter", subject: "an otter", match: /otter/i },
  { key: "sloth", label: "Sloth", subject: "a sloth", match: /sloth/i },
  { key: "duck", label: "Duck", subject: "a yellow duck", match: /duck|quack/i },
  { key: "raccoon", label: "Raccoon", subject: "a raccoon", match: /raccoon|trash panda/i },
  { key: "monkey", label: "Monkey", subject: "a monkey", match: /monkey|ape|chimp/i },
  { key: "bear", label: "Bear", subject: "a brown bear", match: /bear/i },
  { key: "panda", label: "Panda", subject: "a panda", match: /panda/i },
  { key: "fox", label: "Fox", subject: "a red fox", match: /fox/i },
  { key: "owl", label: "Owl", subject: "an owl", match: /owl/i },
  { key: "tiger", label: "Tiger", subject: "a tiger", match: /tiger/i },
  { key: "lion", label: "Lion", subject: "a lion with a big mane", match: /lion/i },
  { key: "shark", label: "Shark", subject: "a friendly shark", match: /shark|fish/i },
  { key: "dragon", label: "Dragon", subject: "a small dragon", match: /dragon/i },
  { key: "unicorn", label: "Unicorn", subject: "a unicorn", match: /unicorn/i },
  { key: "bird", label: "Bird", subject: "a round little bird", match: /bird|chick|parrot/i },
  // Food & drink
  { key: "banana", label: "Banana", subject: "a banana", object: true, match: /banana/i },
  { key: "pizza", label: "Pizza", subject: "a pizza slice", object: true, match: /pizza/i },
  { key: "taco", label: "Taco", subject: "a taco", object: true, match: /taco/i },
  { key: "ramen", label: "Ramen", subject: "a bowl of ramen noodles", object: true, match: /ramen|noodle/i },
  { key: "donut", label: "Donut", subject: "a pink frosted donut", object: true, match: /donut|doughnut/i },
  { key: "avocado", label: "Avocado", subject: "an avocado half", object: true, match: /avocado/i },
  { key: "nugget", label: "Nugget", subject: "a chicken nugget", object: true, match: /nugget/i },
  { key: "pickle", label: "Pickle", subject: "a pickle", object: true, match: /pickle/i },
  { key: "burger", label: "Burger", subject: "a cheeseburger", object: true, match: /burger/i },
  { key: "burrito", label: "Burrito", subject: "a burrito", object: true, match: /burrito/i },
  { key: "waffle", label: "Waffle", subject: "a waffle", object: true, match: /waffle/i },
  { key: "cookie", label: "Cookie", subject: "a chocolate chip cookie", object: true, match: /cookie/i },
  { key: "cheese", label: "Cheese", subject: "a wedge of cheese", object: true, match: /cheese/i },
  { key: "potato", label: "Potato", subject: "a potato", object: true, match: /potato|fries/i },
  { key: "egg", label: "Egg", subject: "a fried egg", object: true, match: /\begg/i },
  { key: "coffee", label: "Coffee", subject: "a takeaway coffee cup", object: true, match: /coffee|latte|barista|espresso/i },
  // Desi & Indian
  { key: "chai", label: "Chai", subject: "a clay kulhad cup of steaming masala chai", object: true, match: /chai|\btea\b/i },
  { key: "samosa", label: "Samosa", subject: "a golden samosa", object: true, match: /samosa/i },
  { key: "biryani", label: "Biryani", subject: "a bowl of biryani", object: true, match: /biryani|curry/i },
  { key: "ladoo", label: "Ladoo", subject: "an orange ladoo sweet", object: true, match: /ladoo|laddu|sweet/i },
  { key: "jalebi", label: "Jalebi", subject: "a swirly orange jalebi sweet", object: true, match: /jalebi/i },
  { key: "rickshaw", label: "Rickshaw", subject: "a yellow and green auto rickshaw", object: true, match: /rickshaw|auto\b/i },
  { key: "cricket", label: "Cricket", subject: "a red cricket ball", object: true, match: /cricket/i },
  { key: "chappal", label: "Chappal", subject: "a rubber flip-flop sandal", object: true, match: /chappal|slipper|sandal/i },
  { key: "uncle", label: "Uncle", subject: "a cheerful middle-aged uncle with a mustache and sweater vest", match: /uncle|aunty|aunt|mom|mother|grandma|granny|desi/i },
  // Tech, space, internet
  { key: "robot", label: "Robot", subject: "a small robot", match: /robot|\bai\b|bot|gpt|android|cyborg|machine/i },
  { key: "brain", label: "Brain", subject: "a pink brain", object: true, match: /brain|neuron|smart/i },
  { key: "alien", label: "Alien", subject: "a green alien", match: /alien|martian/i },
  { key: "astronaut", label: "Astronaut", subject: "an astronaut in a white space suit", match: /astro|space/i },
  { key: "ufo", label: "UFO", subject: "a flying saucer", object: true, match: /ufo|saucer/i },
  { key: "moon", label: "Moon", subject: "a crescent moon", object: true, match: /moon|lunar/i },
  { key: "rocket", label: "Rocket", subject: "a rocket ship", object: true, match: /rocket/i },
  { key: "planet", label: "Planet", subject: "a ringed planet", object: true, match: /planet|saturn|nebula|comet|star/i },
  { key: "ghost", label: "Ghost", subject: "a friendly ghost", match: /ghost|spooky/i },
  { key: "controller", label: "Gamer", subject: "a game controller", object: true, match: /game|gamer|noob|loot|respawn|speedrun|lag/i },
  { key: "npc", label: "NPC", subject: "a plain gray NPC video game character with a blank expression", match: /npc|wojak|lurker/i },
  { key: "sun", label: "Sun", subject: "the sun", object: true, match: /\bsun|summer/i },
  { key: "cloud", label: "Cloud", subject: "a fluffy rain cloud", object: true, match: /cloud|rain/i },
  { key: "fire", label: "Fire", subject: "a little fire spirit flame", object: true, match: /fire|flame|hot|spicy/i },
  // People & jobs
  { key: "office", label: "Office", subject: "an office worker in a shirt and tie holding a coffee mug", match: /office|work|boss|corporate|intern|monday|landlord/i },
  { key: "gym", label: "Gym", subject: "a muscular gym bro", match: /gym|muscle|lift|chad/i },
  { key: "wizard", label: "Wizard", subject: "a wizard with a starry hat", match: /wizard|magic/i },
  { key: "ninja", label: "Ninja", subject: "a ninja", match: /ninja/i },
  { key: "pirate", label: "Pirate", subject: "a pirate", match: /pirate/i },
  { key: "king", label: "King", subject: "a little king with a crown and royal cape", match: /king|queen|royal|lord|sir\b/i },
  { key: "football", label: "Football", subject: "a soccer ball", object: true, match: /football|soccer/i },
  { key: "basketball", label: "Basketball", subject: "a basketball", object: true, match: /basket/i },
  // Brand default
  { key: "lab", label: "Lab", subject: "a round glass laboratory flask filled with glowing lime green liquid", object: true },
]

export const DEFAULT_MASCOT = "lab"
export const mascotUrl = (key: string) => `/mascots/${key}.webp`

/** Pick a mascot key for a topic. Nouns are listed before moods, so "angry penguin" -> penguin. */
export function mascotForTopic(topic: string): string {
  for (const m of MASCOTS) if (m.match?.test(topic)) return m.key
  return DEFAULT_MASCOT
}

export function mascotPrompt(m: MascotDef): string {
  const who = m.object ? `an anthropomorphic ${m.subject.replace(/^an? /, "")} with a cute face, little arms and legs` : m.subject
  return `Cute cartoon mascot character: ${who}. Full body, front-facing, centered, standing pose, friendly confident smile. Thick dark outlines, bold flat colors with soft cel shading, glossy highlights, playful sticker style for a meme brand, consistent with a set of matching mascots. Isolated character on a fully transparent background, no ground shadow, no text, no letters, no logos.`
}

/**
 * Normalize any stored mascot value to an image URL. Older projects stored an emoji; those fall back
 * to the brand mascot so no emoji is ever rendered.
 */
export function resolveMascot(value: string | undefined | null): string {
  if (!value) return mascotUrl(DEFAULT_MASCOT)
  if (/^(\/|https?:|data:|blob:|asset:)/.test(value)) return value
  if (MASCOTS.some((m) => m.key === value)) return mascotUrl(value)
  return mascotUrl(DEFAULT_MASCOT)
}
