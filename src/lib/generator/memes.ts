import type { MemeCardData, MemeLayout } from "@/lib/types"
import { sanitizeDeep } from "@/lib/safety"
import { MEME_TEMPLATES } from "./banks"
import { createRng, randomSeed, uid } from "./random"
import { fill } from "./text"

const PROPS = ["🕶️", "👑", "✨", "💤", "🔥", "🍿", "💀", "🫠", "📱", "☕", "🎉", "🌀", "💫", "🧢"]
const LAYOUTS: MemeLayout[] = ["top-bottom", "caption-above", "tweet", "split"]

const TOP_BOTTOM: [string, string][] = [
  ["ME: I'LL LOG OFF EARLY", "ALSO ME AT 3 AM:"],
  ["ONE DOES NOT SIMPLY", "STOP MAKING {NAME} MEMES"],
  ["NOBODY:", "{NAME}: {CATCH}"],
  ["EXPECTATION: CALM", "REALITY: {NAME}"],
  ["WHEN THE GROUP CHAT", "GOES SILENT"],
  ["I'M NOT {TRAIT}", "I'M {NAME}"],
]

export type MemeSource = { name: string; mascot: string; catchphrase: string; traits: string[]; subject?: string }

export function generateMemesLocal(src: MemeSource, count = 6, seed = randomSeed()): MemeCardData[] {
  const rng = createRng(seed)
  const vars = {
    Name: src.name,
    NAME: src.name.toUpperCase(),
    catchphrase: src.catchphrase,
    CATCH: src.catchphrase.toUpperCase().replace(/[.!]$/, ""),
    subject: src.subject ?? src.name.toLowerCase(),
    TRAIT: (src.traits[0] ?? "weird").toUpperCase(),
  }
  const captions = rng.pickMany(MEME_TEMPLATES, count)
  return sanitizeDeep(
    captions.map((t, i) => {
      const layout = LAYOUTS[(i + rng.int(0, 3)) % LAYOUTS.length]
      const [top, bottom] = rng.pick(TOP_BOTTOM)
      return {
        id: uid("meme"),
        caption: fill(t, vars),
        topText: layout === "top-bottom" ? fill(top, vars) : undefined,
        bottomText: layout === "top-bottom" ? fill(bottom, vars) : undefined,
        emoji: src.mascot,
        props: rng.pickMany(PROPS, 2),
        layout,
        hue: rng.int(0, 359),
      }
    }),
  )
}

export function varyMeme(meme: MemeCardData, src: MemeSource): MemeCardData {
  const [fresh] = generateMemesLocal(src, 1)
  return { ...fresh, id: meme.id }
}
