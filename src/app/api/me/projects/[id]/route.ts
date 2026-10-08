import { NextResponse } from "next/server"
import { z } from "zod"
import { deleteProject, getProject, setPublished } from "@/lib/data/server"
import { body, projectIdSchema, withAccount } from "@/lib/data/route"
import { featureGate } from "@/lib/settings"

type Ctx = RouteContext<"/api/me/projects/[id]">
const idOf = async (ctx: Ctx) => {
  const { id } = await ctx.params
  return projectIdSchema.safeParse(id).success ? id : null
}
const notFound = () => NextResponse.json({ error: "Project not found" }, { status: 404 })

export const GET = (req: Request, ctx: Ctx) =>
  withAccount(req, async (s) => {
    const id = await idOf(ctx)
    const project = id ? await getProject(s.accountId, id) : null
    return project ?? notFound()
  })

export const DELETE = (req: Request, ctx: Ctx) =>
  withAccount(req, async (s) => {
    const id = await idOf(ctx)
    if (!id) return notFound()
    await deleteProject(s.accountId, id)
  })

export const PATCH = (req: Request, ctx: Ctx) =>
  withAccount(req, async (s) => {
    const id = await idOf(ctx)
    const input = await body(req, z.object({ published: z.boolean() }))
    if (input instanceof Response) return input
    // Admin Settings can pause publishing. Unpublishing always works.
    if (input.published) {
      const off = await featureGate((f) => f.publishing, "Publishing")
      if (off) return off
    }
    const project = id ? await setPublished(s.accountId, id, input.published) : null
    return project ?? notFound()
  })
