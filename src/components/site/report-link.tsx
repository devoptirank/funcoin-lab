"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { REPORT_REASONS, type ReportReasonId } from "@/lib/safety"
import { cn } from "@/lib/utils"

/** Small "Report" text button for published sites. Opens a tiny dialog; no sign-in needed. */
export function ReportLink({ slug, className }: { slug: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReasonId>("scam")
  const [details, setDetails] = useState("")
  const [state, setState] = useState<{ kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string }>({ kind: "idle" })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ kind: "sending" })
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "site", slug, reason, details: details.trim() }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Couldn't send the report. Please try again.")
      setState({ kind: "sent" })
      setDetails("")
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Couldn't send the report." })
    }
  }

  const onOpenChange = (o: boolean) => {
    if (state.kind === "sending") return
    setOpen(o)
    if (!o && state.kind !== "idle") setState({ kind: "idle" })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("underline-offset-2 hover:underline", className)}>
        Report
      </button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Report this site</DialogTitle>
          {state.kind === "sent" ? (
            <>
              <DialogDescription>Thanks. The FunCoin Lab team will review this site.</DialogDescription>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <DialogDescription>Tell us what is wrong. Reports are reviewed by the FunCoin Lab team.</DialogDescription>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Reason</span>
                <select className="h-9 rounded-lg border border-border bg-background px-2" value={reason} onChange={(e) => setReason(e.target.value as ReportReasonId)}>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Details (optional)</span>
                <textarea className="min-h-20 rounded-lg border border-border bg-background p-2" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
              </label>
              {state.kind === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={state.kind === "sending"}>
                  Cancel
                </Button>
                <Button type="submit" variant="outline" size="sm" disabled={state.kind === "sending"}>
                  {state.kind === "sending" && <Loader2 className="animate-spin" />} Send report
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
