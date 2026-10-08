"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Copy, Download, LogOut, Moon, Sun } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/components/providers/store-provider"
import { PageHeader } from "@/components/dashboard/page-header"
import { useBilling } from "@/components/billing/billing-provider"
import { Button } from "@/components/ui/button"
import { copyText, downloadFile } from "@/lib/client-api"

type Status = { ai: { provider: string; model: string; images: boolean }; domains: string }

export default function SettingsPage() {
  const { repo } = useStore()
  const billing = useBilling()
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

  return (
    <>
      <PageHeader title="Settings" description="Wallet, appearance and your data." />
      <div className="flex flex-col gap-4">
        <Card title="Wallet">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <p className="text-muted-foreground">Signed in with</p>
              <p className="truncate font-mono">{billing.address}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" onClick={async () => billing.address && (await copyText(billing.address)) && toast.success("Address copied")}>
                <Copy /> Copy
              </Button>
              <Button variant="glass" onClick={() => billing.signOut().then(() => toast.success("Disconnected"))}>
                <LogOut /> Disconnect
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Your wallet is your account. Connect the same wallet on any device to get your projects and credits back.</p>
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
          </div>
          <p className="mt-3 text-xs text-muted-foreground">To delete everything saved for your wallet, contact us from the privacy page.</p>
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
