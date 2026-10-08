/**
 * Art direction for every library coin (public/coins/<slug>.webp). Used by
 * scripts/generate-coins.mts; the in-app logo prompt follows the same style.
 */

export type CoinMetal = "gold" | "silver" | "rose gold" | "gunmetal"

export type CoinArt = {
  slug: string
  /** What is embossed on the coin face. Original characters only. */
  subject: string
  traits: string
  metal: CoinMetal
  accent: string
  palette: string
}

export const COIN_STYLE_RULES =
  "No text, no letters, no numbers, no symbols, no currency signs, no real logos, no real people."

export function coinPrompt(a: Pick<CoinArt, "subject" | "traits" | "metal" | "accent" | "palette">): string {
  return [
    "Premium collectible meme coin, 3D render, three-quarter view tilted about 15 degrees so the thick reeded edge is visible.",
    `Coin face: ${a.subject}, original cute cartoon character embossed in raised relief, colored glossy enamel fills inside crisp metal outlines, expressive face, personality: ${a.traits}.`,
    `Rim: thick beveled ${a.metal} rim with fine reeding, a ring of tiny engraved stars, thin inner ring. Accent: ${a.accent}.`,
    `Palette: ${a.palette}. Studio lighting with a warm key light and a cool rim light, crisp specular highlights on the rim, soft reflection on the face, subtle micro-scratches, a few small sparkles around the coin.`,
    "Centered with padding, isolated on a fully transparent background, soft contact shadow only.",
    COIN_STYLE_RULES,
  ].join("\n")
}

export const COIN_ART: CoinArt[] = [
  // Brand coin
  { slug: "funcoinlab", subject: "a smiling bubbling lab flask full of glowing lime liquid", traits: "cheerful, curious, inventive", metal: "gunmetal", accent: "glow-in-the-dark lime enamel", palette: "lime, deep violet, black" },
  // Original universe
  { slug: "sleepy", subject: "a sleepy orange cat in a lavender nightcap and pajamas", traits: "lazy, cute, chaotic", metal: "gold", accent: "iridescent pearl enamel", palette: "lavender, baby blue, butter yellow" },
  { slug: "banana", subject: "a banana in a tiny business suit and tie", traits: "funny, bossy, slippery", metal: "gold", accent: "holographic foil tie", palette: "banana yellow, tomato red, sky blue" },
  { slug: "alien", subject: "a friendly green alien with big black eyes and a little antenna", traits: "weird, friendly, lost", metal: "silver", accent: "glow-in-the-dark lime eyes", palette: "alien green, purple, silver" },
  { slug: "chad", subject: "a confident cup of masala chai with sunglasses and a steam swirl", traits: "chill, confident, punctual", metal: "gold", accent: "warm amber enamel", palette: "chai brown, saffron, cream" },
  { slug: "moondog", subject: "a happy puppy howling at a crescent moon", traits: "loyal, goofy, dreamy", metal: "silver", accent: "holographic night sky enamel", palette: "midnight blue, moon yellow, white" },
  { slug: "sleepyai", subject: "a small round robot yawning with a sleep cap", traits: "sleepy, smart, poetic", metal: "silver", accent: "soft blue glow screen face", palette: "pastel cyan, white, lilac" },
  { slug: "frogking", subject: "a frog wearing a golden crown and a velvet cape on a lily pad", traits: "royal, dramatic, tiny", metal: "gold", accent: "deep green enamel with gem-like crown", palette: "emerald, royal purple, gold" },
  { slug: "gooseglitch", subject: "a white goose with pixel glitch effects honking", traits: "chaotic, loud, glitchy", metal: "gunmetal", accent: "holographic glitch foil", palette: "white, neon cyan, hot pink" },
  { slug: "samosasquad", subject: "three cheerful samosas hugging with a little chutney bowl", traits: "wholesome, crispy, friendly", metal: "gold", accent: "warm saffron enamel", palette: "golden brown, mint green, tamarind red" },
  { slug: "capybro", subject: "a relaxed capybara in a hot spring with a tiny orange on its head", traits: "calm, friendly, unbothered", metal: "rose gold", accent: "iridescent water enamel", palette: "warm brown, orange, teal" },
  { slug: "pizzalord", subject: "a pizza slice with a monocle, top hat and bow tie", traits: "fancy, snobby, cheesy", metal: "gold", accent: "glossy tomato red enamel", palette: "cheese yellow, tomato red, black" },
  { slug: "npcgpt", subject: "a blocky video game villager with a blank polite smile and a speech bubble", traits: "repetitive, polite, absurd", metal: "silver", accent: "teal pixel enamel", palette: "teal, amber, violet" },
  // Expanded universe
  { slug: "captaintoast", subject: "a heroic golden slice of toast in a flowing red cape striking a brave pose", traits: "heroic, crispy, earnest", metal: "gold", accent: "glossy butter yellow enamel", palette: "toast gold, cape red, cream" },
  { slug: "mothlamp", subject: "a fuzzy cream moth with big starry eyes hugging a glowing desk lamp", traits: "devoted, dreamy, fluttery", metal: "rose gold", accent: "glow-in-the-dark lamp light enamel", palette: "warm yellow, lilac, cream" },
  { slug: "chaiwalacat", subject: "a tabby cat in a tiny apron pouring masala chai from a steel kettle into a glass", traits: "warm, focused, cozy", metal: "gold", accent: "warm amber translucent candy enamel", palette: "chai brown, cardamom green, cream" },
  { slug: "noodleninja", subject: "a steaming ramen bowl with a black ninja headband and determined eyes, chopsticks crossed like swords", traits: "swift, slurpy, stealthy", metal: "gunmetal", accent: "translucent candy red broth enamel", palette: "broth orange, egg yolk yellow, ink black" },
  { slug: "penguinpayroll", subject: "a penguin in a tiny tie and reading glasses holding a clipboard and a stack of paperwork", traits: "diligent, formal, overworked", metal: "silver", accent: "iridescent pearl enamel", palette: "ice blue, white, highlighter yellow" },
  { slug: "cloudnap", subject: "a fluffy sleepy rain cloud in a nightcap with tiny raindrops falling below", traits: "sleepy, soft, drizzly", metal: "silver", accent: "iridescent pearl enamel", palette: "sky blue, lavender, white" },
  { slug: "retrorobo", subject: "a boxy 80s robot with antenna ears and a cassette tape window in its chest", traits: "groovy, nostalgic, clunky", metal: "gunmetal", accent: "holographic foil cassette", palette: "hot pink, electric cyan, sunset yellow" },
  { slug: "tacoturtle", subject: "a smiling green turtle wearing a crunchy taco as its shell, lettuce and salsa peeking out", traits: "slow, snacky, content", metal: "gold", accent: "translucent candy salsa enamel", palette: "taco gold, turtle green, salsa red" },
  { slug: "laserllama", subject: "a fluffy cream llama wearing chunky laser goggles shooting two bright beams", traits: "dramatic, fluffy, intense", metal: "rose gold", accent: "glow-in-the-dark laser enamel", palette: "neon red, aqua, wool cream" },
  { slug: "discoduck", subject: "a yellow duck in flared pants dancing while holding a sparkling mirrorball", traits: "groovy, shiny, extra", metal: "silver", accent: "holographic mirrorball foil", palette: "duck yellow, disco purple, cyan" },
  { slug: "wizardfrog", subject: "a green frog in a tall starry wizard hat and robe holding a glowing wand", traits: "mystic, croaky, wise", metal: "gold", accent: "glow-in-the-dark star enamel", palette: "starry violet, frog green, gold" },
  { slug: "bobabunny", subject: "a fluffy white bunny peeking out of a bubble tea cup with a big straw and tapioca pearls", traits: "bouncy, sweet, chewy", metal: "rose gold", accent: "translucent candy milk tea enamel", palette: "strawberry pink, milk tea brown, cream" },
  { slug: "grumpycactus", subject: "a grumpy little cactus in a terracotta pot wearing a gold monocle and a tiny pink flower", traits: "prickly, fancy, unimpressed", metal: "gold", accent: "glossy jade enamel", palette: "cactus green, terracotta, blush pink" },
  { slug: "spacehamster", subject: "a chubby hamster in a round fishbowl space helmet floating with a sunflower seed", traits: "brave, tiny, curious", metal: "silver", accent: "holographic nebula foil", palette: "hamster orange, cosmic blue, white" },
  { slug: "vadapavviking", subject: "a fierce but friendly vada pav in a horned viking helmet holding a fried green chilli like a sword", traits: "bold, spicy, loud", metal: "gunmetal", accent: "glossy chutney green enamel", palette: "golden brown, chutney green, chilli red" },
  { slug: "lofiowl", subject: "a round owl in oversized headphones sitting by a rainy window with a mug and an open book", traits: "calm, studious, mellow", metal: "rose gold", accent: "iridescent rain enamel", palette: "dusk purple, lamp yellow, rain blue" },
  { slug: "gymgoat", subject: "a determined goat in a sweatband lifting a pair of tiny dumbbells", traits: "determined, sweaty, proud", metal: "gunmetal", accent: "glossy energy orange enamel", palette: "energy orange, chalk white, electric blue" },
  { slug: "pandapixel", subject: "an 8-bit pixel art panda munching a pixel bamboo stalk", traits: "blocky, cute, retro", metal: "silver", accent: "holographic pixel foil", palette: "panda white, bamboo green, arcade pink" },
  { slug: "mememonk", subject: "a serene cartoon monk in saffron robes meditating cross-legged while holding a glowing phone", traits: "calm, wise, online", metal: "gold", accent: "warm saffron translucent candy enamel", palette: "saffron, sand gold, teal" },
  { slug: "sushisumo", subject: "a round sushi roll in a sumo stance with a nori belt and a salmon topknot", traits: "mighty, round, polite", metal: "rose gold", accent: "iridescent pearl rice enamel", palette: "salmon orange, rice white, nori green" },
  { slug: "couchpotatoking", subject: "a smug potato in a tiny crown lounging on a plush velvet sofa throne holding a remote", traits: "royal, relaxed, snacky", metal: "gold", accent: "deep velvet purple enamel", palette: "potato brown, royal purple, gold" },
  { slug: "krakenkeyboard", subject: "a purple octopus with tiny glasses typing on four keyboards at once", traits: "busy, clever, clacky", metal: "gunmetal", accent: "glow-in-the-dark keycap enamel", palette: "octopus purple, aqua, amber" },
  { slug: "rocketsnail", subject: "a determined snail with a little jetpack strapped to its shell and flames puffing out", traits: "patient, bold, zoomy", metal: "rose gold", accent: "translucent candy flame enamel", palette: "flame orange, shell yellow, violet" },
  { slug: "biryanibear", subject: "a big cuddly brown bear hugging a steaming copper biryani pot with a ladle", traits: "protective, hungry, warm", metal: "gold", accent: "warm saffron enamel", palette: "saffron, copper brown, mint green" },
  { slug: "glitchghost", subject: "a shy pixel ghost with horizontal scanlines and glitchy color offsets", traits: "spooky, buggy, shy", metal: "gunmetal", accent: "holographic glitch foil", palette: "neon cyan, magenta, ghost white" },
  { slug: "sneakershark", subject: "a grinning blue shark standing tall in chunky high-top sneakers", traits: "fresh, fast, stylish", metal: "silver", accent: "glossy translucent candy enamel", palette: "ocean blue, sneaker yellow, orange" },
  { slug: "dragondumpling", subject: "a tiny baby dragon hatching out of a plump steamed dumpling with a puff of steam", traits: "tiny, fiery, adorable", metal: "rose gold", accent: "iridescent pearl dumpling enamel", palette: "dragon red, jade green, dough cream" },
  { slug: "cricketcrow", subject: "a cheeky black crow in a cap holding a cricket bat ready to swing", traits: "sharp, cheeky, sporty", metal: "silver", accent: "glossy sky blue enamel", palette: "crow black, sky blue, sun yellow" },
  { slug: "weatherdog", subject: "a fluffy dog in a wizard robe raising a staff topped with a tiny sun and cloud", traits: "wise, loyal, breezy", metal: "gold", accent: "holographic rainbow foil", palette: "sky blue, sunshine yellow, wizard purple" },
  { slug: "jellyjetpack", subject: "a glowing pink jellyfish in a bubble astronaut helmet with a tiny jetpack and trailing tentacles", traits: "floaty, gentle, glowy", metal: "silver", accent: "glow-in-the-dark enamel", palette: "jelly pink, aqua, lavender" },
  { slug: "midnightfridge", subject: "a friendly fridge with big glowing eyes, its door cracked open spilling warm light", traits: "mysterious, generous, humming", metal: "gunmetal", accent: "glow-in-the-dark enamel", palette: "fridge blue, warm light yellow, lilac" },
  { slug: "apearchitect", subject: "a cheerful ape in a yellow hard hat unrolling a big blueprint with a pencil behind its ear", traits: "clever, busy, ambitious", metal: "gold", accent: "blueprint blue enamel", palette: "hard hat yellow, blueprint blue, brown" },
  { slug: "bananaphone", subject: "a chatty banana holding a curly-corded retro rotary phone to its ear", traits: "chatty, retro, silly", metal: "gold", accent: "translucent candy enamel", palette: "banana yellow, phone pink, sky blue" },
  { slug: "cybersamuraicat", subject: "a sleek cat in glowing neon samurai armor holding a light-edged katana", traits: "honorable, sleek, electric", metal: "gunmetal", accent: "glow-in-the-dark neon enamel", palette: "neon pink, cyan, ultraviolet" },
  { slug: "parrotdj", subject: "a bright parrot with an eye patch and pirate hat scratching records on tiny DJ turntables", traits: "loud, rhythmic, swashbuckling", metal: "gold", accent: "holographic vinyl foil", palette: "parrot green, red, treasure yellow" },
  { slug: "moonmochi", subject: "a round squishy pink mochi with rosy cheeks floating among tiny stars and a crescent", traits: "soft, dreamy, squishy", metal: "rose gold", accent: "iridescent pearl enamel", palette: "sakura pink, matcha green, cream" },
]

export const coinArtBySlug = (slug: string) => COIN_ART.find((c) => c.slug === slug)
