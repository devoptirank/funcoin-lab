"use client"
import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { CheckCircle2, Clock, Loader2, X, XCircle } from "lucide-react"
import { dismissJob, queuePosition, useImageJobs, type ImageJob } from "@/lib/assets/queue"
import { cn } from "@/lib/utils"

const secs = (ms: number) => Math.max(1, Math.ceil(ms / 1000))

/** Live status for one job: countdown while running, place in line while queued. */
function describe(job: ImageJob, all: ImageJob[], now: number) {
  if (job.status === "done") return { text: "Ready", pct: 100 }
  if (job.status === "error") return { text: job.error ?? "Failed", pct: 100 }
  if (job.status === "running") {
    const elapsed = now - (job.startedAt ?? now)
    const left = job.etaMs - elapsed
    return {
      text: left > 1000 ? `About ${secs(left)}s left` : "Finishing up...",
      // Never shows 100% before the image is actually back.
      pct: Math.min(95, (elapsed / job.etaMs) * 100),
    }
  }
  // Queued: wait for the soonest running job, then everything ahead of us.
  const pos = queuePosition(all, job.id)
  const running = all.filter((j) => j.status === "running").map((j) => Math.max(0, j.etaMs - (now - (j.startedAt ?? now))))
  const ahead = all.filter((j) => j.status === "queued").slice(0, pos - 1).reduce((t, j) => t + j.etaMs, 0)
  const wait = (running.length ? Math.min(...running) : 0) + ahead / 2
  return { text: `Queued, #${pos} in line${wait > 1000 ? `, starts in about ${secs(wait)}s` : ""}`, pct: 0 }
}

/** Floating panel listing AI image jobs with a countdown for each. */
export function ImageQueuePanel() {
  const jobs = useImageJobs()
  const reduce = useReducedMotion()
  const [now, setNow] = useState(() => Date.now())
  const active = jobs.some((j) => j.status === "running" || j.status === "queued")

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [active])

  const running = jobs.filter((j) => j.status === "running").length
  const queued = jobs.filter((j) => j.status === "queued").length

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-50 flex justify-end sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4">
      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.section
            aria-label="AI image queue"
            aria-live="polite"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            className="pointer-events-auto w-full rounded-3xl border border-border bg-popover p-3 shadow-2xl sm:w-80"
          >
            <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">
              {active ? `Generating ${running} image${running === 1 ? "" : "s"}${queued ? `, ${queued} waiting` : ""}` : "Images ready"}
            </p>
            <ul className="flex flex-col gap-2">
              {jobs.map((job) => {
                const { text, pct } = describe(job, jobs, now)
                return (
                  <li key={job.id} className="rounded-2xl bg-foreground/[0.04] p-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0" aria-hidden>
                        {job.status === "running" && <Loader2 className="size-4 animate-spin text-lab" />}
                        {job.status === "queued" && <Clock className="size-4 text-muted-foreground" />}
                        {job.status === "done" && <CheckCircle2 className="size-4 text-lab" />}
                        {job.status === "error" && <XCircle className="size-4 text-destructive" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{job.label}</p>
                        <p className={cn("text-xs tabular-nums", job.status === "error" ? "text-destructive" : "text-muted-foreground")}>{text}</p>
                      </div>
                      {(job.status === "done" || job.status === "error") && (
                        <button type="button" onClick={() => dismissJob(job.id)} aria-label="Dismiss" className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground">
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {job.status !== "error" && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={job.label}>
                        <div className="h-full rounded-full bg-[var(--lab)] transition-[width] duration-500 ease-linear" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
