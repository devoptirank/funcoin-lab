import { handleJson } from "@/lib/api"
import { domainCheckSchema } from "@/lib/ai/schemas"
import { getDomainProvider } from "@/lib/domains"
import { isValidFunDomain } from "@/lib/generator/domains"

export async function POST(req: Request) {
  return handleJson(req, { scope: "domain-check", schema: domainCheckSchema, limit: 30, feature: { on: (f) => f.domainSearch, name: "Domain search" } }, async ({ domains }) => {
    const valid = [...new Set(domains)].filter(isValidFunDomain)
    const provider = getDomainProvider()
    return { provider: provider.id, results: await provider.check(valid) }
  })
}
