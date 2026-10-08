import { z } from "zod"
import { handleJson } from "@/lib/api"
import { brandRefSchema } from "@/lib/ai/schemas"
import { generateLogo } from "@/lib/ai/tasks"

export const maxDuration = 120

export async function POST(req: Request) {
  return handleJson(req, { scope: "logo", schema: z.object({ brand: brandRefSchema }), limit: 8, feature: { on: (f) => f.tools.logo, name: "The logo generator" } }, ({ brand }) => generateLogo(brand))
}
