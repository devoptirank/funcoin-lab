import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin/guard"
import { buildInfo, envChecklist, runHealthChecks, type CheckStatus, type EnvState } from "@/lib/admin/health"
import { AdminHeader, Badge, Panel, Table, When } from "@/components/admin/ui"

export const metadata: Metadata = { title: "System" }

const CHECK_TONE: Record<CheckStatus, "good" | "warn" | "bad" | "neutral"> = { ok: "good", warn: "warn", down: "bad", off: "neutral" }
const CHECK_TEXT: Record<CheckStatus, string> = { ok: "OK", warn: "Warning", down: "Down", off: "Off" }
const ENV_TONE: Record<EnvState, "good" | "warn" | "bad" | "neutral"> = { set: "good", missing: "bad", invalid: "bad", optional: "neutral" }
const ENV_TEXT: Record<EnvState, string> = { set: "Set", missing: "Missing", invalid: "Invalid", optional: "Not set" }

export default async function SystemPage() {
  await requireAdmin("system.read")
  const [checks, env, build] = await Promise.all([runHealthChecks({ timeoutMs: 5000, deep: true }), Promise.resolve(envChecklist()), Promise.resolve(buildInfo())])
  const groups = [...new Set(env.map((r) => r.group))]
  const problems = env.filter((r) => r.state === "missing" || r.state === "invalid").length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminHeader title="System health" description="Live checks run when this page loads. Env values are never shown, only whether they are set and valid." />

      <Panel title="Integrations">
        <Table>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Status</th>
              <th scope="col">Details</th>
              <th scope="col" className="text-right">
                Latency
              </th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.label}</td>
                <td>
                  <Badge tone={CHECK_TONE[c.status]}>{CHECK_TEXT[c.status]}</Badge>
                </td>
                <td className="text-muted-foreground">{c.detail}</td>
                <td className="text-right tabular-nums">{c.latencyMs === undefined ? "-" : `${c.latencyMs} ms`}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Build">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted-foreground">Environment</dt>
          <dd>{build.environment}</dd>
          <dt className="text-muted-foreground">Commit</dt>
          <dd className="font-mono text-xs">{build.commit ? build.commit.slice(0, 12) : "Not available (not a Vercel build)"}</dd>
          <dt className="text-muted-foreground">Branch</dt>
          <dd>{build.branch ?? "-"}</dd>
          <dt className="text-muted-foreground">Region</dt>
          <dd>{build.region ?? "-"}</dd>
          <dt className="text-muted-foreground">Deployment</dt>
          <dd className="font-mono text-xs break-all">{build.deploymentId ?? "-"}</dd>
          <dt className="text-muted-foreground">This server instance started</dt>
          <dd>
            <When iso={build.instanceStarted} />
          </dd>
        </dl>
      </Panel>

      <Panel title={`Environment variables${problems ? ` (${problems} to fix)` : ""}`}>
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g}</h3>
              <Table>
                <thead>
                  <tr>
                    <th scope="col" className="w-[45%]">
                      Variable
                    </th>
                    <th scope="col" className="w-24">
                      State
                    </th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {env
                    .filter((r) => r.group === g)
                    .map((r) => (
                      <tr key={r.name}>
                        <td className="font-mono text-xs break-all">{r.name}</td>
                        <td>
                          <Badge tone={ENV_TONE[r.state]}>{ENV_TEXT[r.state]}</Badge>
                        </td>
                        <td className="text-muted-foreground">{r.note ?? ""}</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
