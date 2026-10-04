import { z } from "zod"
import { handleJson } from "@/lib/api"
import { brandRefSchema } from "@/lib/ai/schemas"
import { generateSocialBios } from "@/lib/ai/tasks"

export async function POST(req: Request) {
  return handleJson(req, { scope: "social", schema: z.object({ brand: brandRefSchema }), limit: 20 }, async ({ brand }) => {
    const { data, source } = await generateSocialBios(brand)
    return { bios: data, source }
  })
}
