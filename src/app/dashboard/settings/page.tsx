"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Download, LogOut, Moon, Sun, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { ButtonLink } from "@/components/shared/button-link"
import { Button } from "@/components/ui/button"
import { downloadFile } from "@/lib/client-api"

type Status = { ai: { provider: string; model: string; images: boolean }; domains: string }

export default function SettingsPage() {
  const { user, repo, signOut, cloudAvailable, bump } = useStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {})
  }, [])

  const exportData = async () => {
    const [projects, domains] = await Promise.all([repo.listProjects(), repo.listDomains()])
    downloadFile(`funcoin-lab-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), projects, domains }, null, 2), "application/json")
    toast.success("Export downloaded")
  }

  const clearLocal = () => {
    if (!window.confirm("Delete all projects and domains saved in this browser?")) return
    for (const k of Object.keys(localStorage)) if (k.startsWith("fcl:")) localStorage.removeItem(k)
    bump()
    toast.success("Local data cleared")
  }

  return (
    <>
      <PageHeader title="Settings" description="Account, appearance and your data." />
      <div className="flex flex-col gap-4">
        <Card title="Account">
          {user ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                Signed in as <strong>{user.email}</strong>. Projects sync to your account.
              </p>
              <Button variant="glass" onClick={() => signOut().then(() => toast.success("Signed out"))}>
                <LogOut /> Sign out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Guest mode. Data lives in this browser.</p>
              {cloudAvailable && <ButtonLink href="/login?next=/dashboard/settings" variant="glow" size="lg" className="px-4">Sign in</ButtonLink>}
            </div>
          )}
        </Card>
        <Card title="Appearance">
          <div className="flex gap-2">
            <Button variant={resolvedTheme === "dark" ? "glow" : "glass"} size="lg" onClick={() => setTheme("dark")}><Moon /> Dark</Button>
            <Button variant={resolvedTheme === "light" ? "glow" : "glass"} size="lg" onClick={() => setTheme("light")}><Sun /> Light</Button>
          </div>
        </Card>
        <Card title="Your data">
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" size="lg" onClick={exportData}><Download /> Export JSON</Button>
            {repo.kind === "local" && <Button variant="ghost" size="lg" className="text-destructive" onClick={clearLocal}><Trash2 /> Clear browser data</Button>}
          </div>
          {repo.kind === "cloud" && <p className="mt-3 text-xs text-muted-foreground">To delete your account and cloud data, contact us from the privacy page.</p>}
        </Card>
        <Card title="Lab status">
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">AI provider</dt><dd className="font-mono">{status ? `${status.ai.provider} (${status.ai.model})` : "…"}</dd></div>
            <div><dt className="text-muted-foreground">Image generation</dt><dd className="font-mono">{status ? (status.ai.images ? "enabled" : "off") : "…"}</dd></div>
            <div><dt className="text-muted-foreground">Domain checks</dt><dd className="font-mono">{status?.domains ?? "…"}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  )
}
