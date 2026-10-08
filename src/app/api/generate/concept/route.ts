import { NextResponse } from "next/server"
import { handleJson } from "@/lib/api"
import { conceptRequestSchema } from "@/lib/ai/schemas"
import { generateConcept } from "@/lib/ai/tasks"
import { checkTopicServer } from "@/lib/safety-server"

export async function POST(req: Request) {
  return handleJson(req, { scope: "concept", schema: conceptRequestSchema, limit: 15, feature: { on: (f) => f.tools.concept, name: "The idea generator" } }, async (input) => {
    const check = await checkTopicServer(input.topic)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 422 })
    const { data, source } = await generateConcept(input)
    return { concept: data, source }
  })
}
