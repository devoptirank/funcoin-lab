import { handleJson } from "@/lib/api"
import { contentRequestSchema } from "@/lib/ai/schemas"
import { generateContent } from "@/lib/ai/tasks"

export async function POST(req: Request) {
  return handleJson(req, { scope: "content", schema: contentRequestSchema, limit: 20, feature: { on: (f) => f.tools.content, name: "The content generator" } }, async ({ brand, platform, contentType }) => {
    const { data, source } = await generateContent(brand, platform, contentType)
    return { variations: data, source }
  })
}
