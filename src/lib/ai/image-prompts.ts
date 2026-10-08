import "server-only"

export const IMAGE_ASSET_TYPES = ["logo", "mascot", "meme", "banner", "site-hero"] as const
export type ImageAssetType = (typeof IMAGE_ASSET_TYPES)[number]
export const MASCOT_POSES = ["happy", "sleepy", "angry", "celebrating"] as const
export type MascotPose = (typeof MASCOT_POSES)[number]

type Brand = { name: string; mascot: string; subject?: string; tagline: string; traits: string[]; logoConcept?: string; palette?: string[] }

/** Size per asset type. gpt-image-2 accepts any WxH divisible by 16 with aspect between 1:3 and 3:1. */
export const IMAGE_SIZE: Record<ImageAssetType, string> = {
  logo: "1024x1024",
  mascot: "1024x1024",
  meme: "1024x1024",
  banner: "1536x512",
  "site-hero": "1536x1024",
}

// Shared constraints on every image: no text (captions are overlaid in HTML), nothing real.
const RULES =
  "No text, letters, numbers or watermarks anywhere in the image. No real people, no real brands or logos, no flags, no currency symbols, no coins, no charts. Friendly, original cartoon character."

function describe(b: Brand) {
  const traits = b.traits.slice(0, 3).join(", ").toLowerCase() || "playful"
  const colors = b.palette?.length ? `Color palette: ${b.palette.slice(0, 4).join(", ")}.` : ""
  const what = b.subject?.trim() || b.name
  return { subject: `an original cartoon mascot character based on ${what}, named ${b.name}, personality: ${traits}`, colors }
}

export function buildImagePrompt(type: ImageAssetType, b: Brand, extra: { pose?: string; scene?: string } = {}): string {
  const { subject, colors } = describe(b)
  switch (type) {
    case "logo":
      // Same art direction as the coin library (src/lib/coin-art.ts). gpt-image-2 has no transparent
      // backgrounds, so the coin sits on a plain dark backdrop.
      return `Premium collectible meme coin, 3D render, three-quarter view tilted about 15 degrees so the thick reeded edge is visible. Coin face: ${subject} embossed in raised relief, colored glossy enamel fills inside crisp metal outlines, expressive face. ${b.logoConcept ? `Concept: ${b.logoConcept}.` : ""} Rim: thick beveled polished metal rim with fine reeding, a ring of tiny engraved stars, thin inner ring, one accent of holographic foil or glowing enamel. Studio lighting with a warm key light and a cool rim light, crisp specular highlights, subtle micro-scratches, a few small sparkles. Centered with padding on a plain solid background in the darkest palette color, soft contact shadow. ${colors} ${RULES.replace(" no coins,", "")}`
    case "mascot":
      return `Full-body character illustration of ${subject}, pose and expression: ${extra.pose ?? "happy"}. Expressive 2D cartoon style with thick outlines and soft shading, character centered with breathing room, plain light background with a subtle soft shadow under the feet. ${colors} ${RULES}`
    case "meme":
      return `Funny meme-style scene starring ${subject}. Situation: ${extra.scene ?? b.tagline}. Exaggerated reaction-image expression, bold cartoon style, simple readable composition with empty space at the top and bottom for captions. ${colors} ${RULES}`
    case "banner":
      return `Wide social media header banner featuring ${subject} on the right third, with playful abstract shapes and sparkles across a smooth gradient background. Leave the left side calm and uncluttered. ${colors} ${RULES}`
    case "site-hero":
      return `Hero illustration for a playful website: ${subject} in a dynamic, joyful pose surrounded by floating doodles and bubbles. Vibrant cartoon style, depth and soft lighting, background in the brand palette. ${colors} ${RULES}`
  }
}
