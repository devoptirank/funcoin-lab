import { NextResponse } from "next/server"
import { handleJson } from "@/lib/api"
import { conceptRequestSchema } from "@/lib/ai/schemas"
import { generateConcept } from "@/lib/ai/tasks"
import { checkTopic } from "@/lib/safety"

export async function POST(req: Request) {
  return handleJson(req, { scope: "concept", schema: conceptRequestSchema, limit: 15 }, async (input) => {
    const check = checkTopic(input.topic)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 422 })
    const { data, source } = await generateConcept(input)
    return { concept: data, source }
  })
}
