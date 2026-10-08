import { z } from "zod"
import { handleJson } from "@/lib/api"
import { brandRefSchema } from "@/lib/ai/schemas"
import { generateMemes } from "@/lib/ai/tasks"

export async function POST(req: Request) {
  return handleJson(req, { scope: "memes", schema: z.object({ brand: brandRefSchema }), limit: 20, feature: { on: (f) => f.tools.memes, name: "The meme generator" } }, async ({ brand }) => {
    const { data, source } = await generateMemes(brand)
    return { memes: data, source }
  })
}
