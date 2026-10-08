import { NextResponse } from "next/server"
import { handleJson } from "@/lib/api"
import { domainRequestSchema } from "@/lib/ai/schemas"
import { generateDomains } from "@/lib/ai/tasks"
import { checkTopicServer } from "@/lib/safety-server"

export async function POST(req: Request) {
  return handleJson(req, { scope: "domains", schema: domainRequestSchema, limit: 20, feature: { on: (f) => f.tools.domains, name: "Domain ideas" } }, async ({ topic }) => {
    const check = await checkTopicServer(topic)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 422 })
    const { data, source } = await generateDomains(topic)
    return { domains: data, source }
  })
}
