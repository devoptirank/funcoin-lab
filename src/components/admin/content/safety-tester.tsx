"use client"
import { useState } from "react"
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Result = { sanitized: string; topicOk: boolean; blockedBy: string | null }

/** "Test a phrase": shows what sanitizeText and the topic check (with admin terms) would do. */
export function SafetyTester() {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/safety/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
      const json = (await res.json().catch(() => ({}))) as Partial<Result> & { error?: string }
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`)
      setResult(json as Result)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : "Test failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={run} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Phrase</span>
        <textarea
          className="min-h-20 rounded-lg border border-border bg-background p-2"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example: Buy now, this coin will 100x to the moon"
        />
      </label>
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={busy || !text.trim()}>
          {busy && <Loader2 className="animate-spin" />} Test phrase
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">After sanitizeText</p>
            <p className="mt-1 break-words whitespace-pre-wrap">{result.sanitized || <span className="text-muted-foreground">(empty)</span>}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Topic check</p>
            {result.topicOk ? (
              <p className="mt-1 flex items-center gap-1.5">
                <CircleCheck className="size-4 text-lab" aria-hidden /> Passes. This topic can be used.
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5">
                <CircleAlert className="size-4 text-destructive" aria-hidden /> Blocked by the term &quot;{result.blockedBy}&quot;.
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
