import { z } from "zod"
import { adminDb, adminRoute, adminRpc } from "@/lib/admin/api"
import { actor } from "@/lib/admin/audit"
import { forgetAccountStatus } from "@/lib/admin/account-status"
import { can, type Permission } from "@/lib/admin/permissions"
import { moderateAsset, moderateProject, reasonSchema } from "@/components/admin/content/actions"

/**
 * Resolve a content report. Dismiss closes it; hide, remove and suspend act on the reported site or
 * image (or its owner) and then close it as actioned. Each step is its own audited SQL call.
 */

const schema = z.object({ reportId: z.uuid(), action: z.enum(["dismiss", "hide", "remove", "suspend"]), reason: reasonSchema })

const NEEDS: Record<z.infer<typeof schema>["action"], Permission | null> = {
  dismiss: null,
  hide: "content.moderate",
  remove: "content.moderate",
  suspend: "accounts.status",
}

const fail = (message: string, status: number) => Object.assign(new Error(message), { status })

export const POST = (req: Request) =>
  adminRoute(req, { permission: "reports.resolve", schema }, async (ctx, input) => {
    const extra = NEEDS[input.action]
    if (extra && !can(ctx.role, extra)) throw fail("Your role can't take this action.", 403)

    const sb = adminDb()
    const { data: report } = await sb.from("content_reports").select("id, target_type, target_id, status").eq("id", input.reportId).maybeSingle()
    if (!report) throw fail("Report not found", 404)
    if (report.status !== "open") throw fail("This report is already resolved.", 409)

    const isSite = report.target_type === "site"
    if (input.action === "hide" || input.action === "remove") {
      const status = input.action === "hide" ? "hidden" : "removed"
      if (isSite) await moderateProject(ctx, report.target_id, status, input.reason)
      else await moderateAsset(ctx, report.target_id, status, input.reason)
    } else if (input.action === "suspend") {
      const { data: target } = isSite
        ? await sb.from("projects").select("account_id").eq("id", report.target_id).maybeSingle()
        : await sb.from("generated_assets").select("account_id").eq("id", report.target_id).maybeSingle()
      const owner = target?.account_id as string | undefined
      if (!owner) throw fail("The reported item no longer exists, so its owner can't be found.", 404)
      // Never downgrade a ban to a suspension; an already blocked owner just gets the report closed.
      const { data: account } = await sb.from("billing_accounts").select("status").eq("id", owner).maybeSingle()
      if (account?.status !== "banned" && account?.status !== "suspended") {
        await adminRpc("admin_set_account_status", { p_actor: actor(ctx), p_account: owner, p_status: "suspended", p_reason: input.reason })
        forgetAccountStatus(owner)
      }
    }

    await adminRpc("admin_resolve_report", {
      p_actor: actor(ctx),
      p_report: input.reportId,
      p_status: input.action === "dismiss" ? "dismissed" : "actioned",
      p_reason: input.reason,
    })
    return { ok: true }
  })
