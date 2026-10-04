import { NextResponse } from "next/server"
import { handleJson } from "@/lib/api"
import { domainRequestSchema } from "@/lib/ai/schemas"
import { generateDomains } from "@/lib/ai/tasks"
import { checkTopic } from "@/lib/safety"

export async function POST(req: Request) {
  return handleJson(req, { scope: "domains", schema: domainRequestSchema, limit: 20 }, async ({ topic }) => {
    const check = checkTopic(topic)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 422 })
    const { data, source } = await generateDomains(topic)
    return { domains: data, source }
  })
}
