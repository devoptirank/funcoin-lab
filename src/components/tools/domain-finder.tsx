"use client"
import { useCallback, useEffect, useState } from "react"
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Search, ShieldQuestion } from "lucide-react"
import { toast } from "sonner"
import type { DomainCheckResult, DomainStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CopyButton } from "@/components/shared/copy-button"
import { useRepoData, useStore } from "@/components/providers/store-provider"
import { generateDomainIdeas } from "@/lib/generator/domains"
import { postJSON } from "@/lib/client-api"
import Link from "next/link"
import { isAffiliateLink, registrarName, trackedRegistrarHref } from "@/lib/domains/affiliate"
import { cn } from "@/lib/utils"

type Row = { domain: string; status: DomainStatus; message?: string; price?: string }

const STATUS: Record<DomainStatus, { label: string; className: string }> = {
  unchecked: { label: "Not checked", className: "border-border text-muted-foreground" },
  checking: { label: "Checking…", className: "border-border text-muted-foreground" },
  available: { label: "Available", className: "border-lab-fill/50 bg-lab-fill/10 text-lab" },
  "no-record": { label: "No record found", className: "border-lab-fill/40 text-lab" },
  registered: { label: "Registered", className: "border-border text-muted-foreground line-through decoration-1" },
  unknown: { label: "Unknown", className: "border-border text-muted-foreground" },
  error: { label: "Check failed", className: "border-destructive/40 text-destructive" },
}

export function DomainStatusBadge({ status, message, price }: { status: DomainStatus; message?: string; price?: string }) {
  const s = STATUS[status]
  const badge = (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", s.className)}>
      {status === "checking" && <Loader2 className="size-3 animate-spin" />}
      {s.label}
      {status === "available" && price && <span className="font-mono opacity-80">· ${price.replace(/\s*USD$/i, "")}</span>}
    </span>
  )
  if (!message) return badge
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />}>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{message}</TooltipContent>
    </Tooltip>
  )
}

/** Outbound "buy" link: goes through our tracked redirect, opens the registrar in a new tab. */
export function BuyDomainLink({ domain, source, available }: { domain: string; source: string; available?: boolean }) {
  return (
    <a
      href={trackedRegistrarHref(domain, source)}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors",
        available ? "bg-lab-fill text-lab-ink hover:bg-[color-mix(in_oklab,var(--lab),white_12%)]" : "border border-border text-muted-foreground hover:text-foreground",
      )}
    >
      Get it on {registrarName} <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(opens in a new tab{isAffiliateLink ? ", affiliate link" : ""})</span>
    </a>
  )
}

export function AffiliateNote({ className }: { className?: string }) {
  if (!isAffiliateLink) return null
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Buy links are affiliate links: we may earn a commission at no extra cost to you.{" "}
      <Link href="/affiliate-disclosure" className="underline underline-offset-4 hover:text-foreground">
        Learn more
      </Link>
    </p>
  )
}

type FinderProps = { initialTopic?: string; autoRun?: boolean; compact?: boolean }

export function DomainFinder(props: FinderProps) {
  return <DomainFinderInner key={props.initialTopic ?? ""} {...props} />
}

function DomainFinderInner({ initialTopic = "", autoRun = false, compact = false }: FinderProps) {
  const { repo, bump } = useStore()
  const { data: saved } = useRepoData((r) => r.listDomains(), [])
  const savedSet = new Set(saved.map((d) => d.domain))
  const [topic, setTopic] = useState(initialTopic)
  const auto = autoRun && initialTopic.trim().length > 0
  // Instant local suggestions first; AI suggestions replace them when they arrive.
  const localRows = (t: string): Row[] => generateDomainIdeas(t, 12).map((domain) => ({ domain, status: "unchecked" }))
  const [rows, setRows] = useState<Row[]>(() => (auto ? localRows(initialTopic.trim()) : []))
  const [loading, setLoading] = useState(auto)
  const [lastTopic, setLastTopic] = useState(auto ? initialTopic.trim() : "")

  const fetchSuggestions = useCallback((t: string) => {
    postJSON<{ domains: string[] }>("/api/generate/domains", { topic: t })
      .then((res) => setRows(res.domains.map((domain) => ({ domain, status: "unchecked" as DomainStatus }))))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't generate domains"))
      .finally(() => setLoading(false))
  }, [])

  const generate = (value: string) => {
    const t = value.trim()
    if (!t) return
    setLoading(true)
    setLastTopic(t)
    setRows(localRows(t))
    fetchSuggestions(t)
  }

  useEffect(() => {
    if (auto) fetchSuggestions(initialTopic.trim())
  }, [auto, initialTopic, fetchSuggestions])

  const check = async (domains: string[]) => {
    setRows((r) => r.map((row) => (domains.includes(row.domain) ? { ...row, status: "checking" } : row)))
    try {
      const res = await postJSON<{ provider: string; results: DomainCheckResult[] }>("/api/domains/check", { domains })
      const map = new Map(res.results.map((x) => [x.domain, x]))
      setRows((r) => r.map((row) => (map.has(row.domain) ? { ...row, status: map.get(row.domain)!.status, message: map.get(row.domain)!.message, price: map.get(row.domain)!.price } : row)))
      if (res.provider === "none") {
        toast.info("No registrar connected yet", {
          description: `Availability wasn't checked. Use “Get it on ${registrarName}” to search there, or connect the registrar API.`,
        })
      }
    } catch (e) {
      setRows((r) => r.map((row) => (domains.includes(row.domain) ? { ...row, status: "error" } : row)))
      toast.error(e instanceof Error ? e.message : "Check failed")
    }
  }

  const toggleSave = async (row: Row) => {
    try {
      if (savedSet.has(row.domain)) {
        await repo.removeDomain(row.domain)
        toast("Removed from saved domains")
      } else {
        await repo.saveDomain({ domain: row.domain, topic: lastTopic, status: row.status, savedAt: new Date().toISOString() })
        toast.success("Saved to your dashboard")
      }
      bump()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save domain")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!compact && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            generate(topic)
          }}
          className="glass flex flex-col gap-2 rounded-3xl p-2 sm:flex-row"
        >
          <label htmlFor="domain-topic" className="sr-only">
            Meme idea
          </label>
          <Input
            id="domain-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={60}
            placeholder="Your meme idea, e.g. Sleepy Cat"
            className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button type="submit" variant="glow" size="xl" disabled={loading || !topic.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />} Find .fun names
          </Button>
        </form>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        These are name ideas, not availability guarantees. “Check Domain” asks the connected registrar; without one, nothing is checked. Prices and availability are confirmed at checkout on {registrarName}.
      </p>
      <AffiliateNote />

      {rows.length === 0 && loading && (
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rows.length} ideas for <span className="font-semibold text-foreground">“{lastTopic}”</span>
            </p>
            <Button size="sm" variant="glass" onClick={() => check(rows.map((r) => r.domain).slice(0, 20))}>
              Check all
            </Button>
          </div>
          <ul className="grid gap-2">
            {rows.map((row) => (
              <li key={row.domain} className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                <p className="min-w-0 flex-1 truncate font-mono text-base font-semibold">
                  {row.domain.replace(/\.fun$/, "")}
                  <span className="text-lab">.fun</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DomainStatusBadge status={row.status} message={row.message} price={row.price} />
                  <CopyButton text={row.domain} size="icon-sm" />
                  <Button size="sm" variant="outline" onClick={() => check([row.domain])} disabled={row.status === "checking"}>
                    Check Domain
                  </Button>
                  {row.status !== "registered" && <BuyDomainLink domain={row.domain} source={compact ? "results" : "finder"} available={row.status === "available"} />}
                  <Button size="icon-sm" variant="ghost" aria-label={savedSet.has(row.domain) ? "Remove saved domain" : "Save domain"} onClick={() => toggleSave(row)}>
                    {savedSet.has(row.domain) ? <BookmarkCheck className="text-lab" /> : <Bookmark />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
