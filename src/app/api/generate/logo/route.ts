import { z } from "zod"
import { handleJson } from "@/lib/api"
import { brandRefSchema } from "@/lib/ai/schemas"
import { generateLogo } from "@/lib/ai/tasks"

export const maxDuration = 120

export async function POST(req: Request) {
  return handleJson(req, { scope: "logo", schema: z.object({ brand: brandRefSchema }), limit: 8 }, ({ brand }) => generateLogo(brand))
}
