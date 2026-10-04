"use client"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Download, Eye, Globe, Laptop, Loader2, Save, Smartphone } from "lucide-react"
import { toast } from "sonner"
import type { SavedProject, SiteConfig, SiteSectionId } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { MemeSite } from "@/components/site/meme-site"
import { EmptyState } from "@/components/shared/empty-state"
import { ButtonLink } from "@/components/shared/button-link"
import { useStore } from "@/components/providers/store-provider"
import { conceptToSite } from "@/lib/generator/site"
import { templateById } from "@/lib/site/templates"
import { renderSiteHTML } from "@/lib/site/export"
import { downloadFile } from "@/lib/client-api"
import { sanitizeDeep } from "@/lib/safety"
import { burst } from "@/lib/burst"
import { assetRefToDataUrl } from "@/lib/assets/store"
import { cn } from "@/lib/utils"
import { SectionPanel, type EditorSection } from "./section-panel"
import { StylePanel } from "./style-panel"

type MobilePane = "sections" | "preview" | "style"

/** Clean up a config before it's stored or exported: safe links, guardrail text, fixed disclaimer. */
function finalize(site: SiteConfig, defaults: SiteConfig): SiteConfig {
  const links = { ...site.community.links }
  for (const k of Object.keys(links) as (keyof typeof links)[]) if (links[k] && !/^https:\/\/\S+$/i.test(links[k])) links[k] = ""
  const clean = sanitizeDeep({ ...site, community: { ...site.community, links } })
  return { ...clean, community: { ...clean.community, links }, token: { ...clean.token, note: clean.token.note || defaults.token.note } }
}

export function SiteEditor({ projectId }: { projectId: string }) {
  const { repo, ready, user, cloudAvailable } = useStore()
  const [project, setProject] = useState<SavedProject | null>(null)
  const [site, setSite] = useState<SiteConfig | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading")
  const [active, setActive] = useState<EditorSection>("hero")
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [pane, setPane] = useState<MobilePane>("preview")
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<null | "save" | "publish">(null)

  useEffect(() => {
    if (!ready) return
    repo
      .getProject(projectId)
      .then((p) => {
        if (!p) return setStatus("missing")
        setProject(p)
        setSite(p.site ?? conceptToSite(p.concept))
        setStatus("ready")
      })
      .catch(() => setStatus("missing"))
  }, [projectId, ready, repo])

  const update = useCallback((fn: (s: SiteConfig) => SiteConfig) => {
    setSite((s) => (s ? fn(s) : s))
    setDirty(true)
  }, [])

  const save = useCallback(async (): Promise<SavedProject | null> => {
    if (!project || !site) return null
    setBusy("save")
    try {
      let clean = finalize(site, conceptToSite(project.concept))
      // Browser-only artwork ("asset:<id>") can't be shown on a cloud/published site.
      if (repo.kind === "cloud" && clean.brand.mascotImage?.startsWith("asset:")) {
        clean = { ...clean, brand: { ...clean.brand, mascotImage: undefined } }
        toast.info("Mascot image removed", { description: "It was stored only in this browser. Generate it again while signed in to use it online." })
      }
      const saved = await repo.saveProject({ ...project, site: clean })
      setProject(saved)
      setSite(clean)
      setDirty(false)
      toast.success("Saved")
      return saved
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save")
      return null
    } finally {
      setBusy(null)
    }
  }, [project, site, repo])

  // ⌘/Ctrl+S to save; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        save()
      }
    }
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("beforeunload", onUnload)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("beforeunload", onUnload)
    }
  }, [save, dirty])

  const preview = async () => {
    const saved = dirty ? await save() : project
    if (saved) window.open(`/preview/${saved.id}`, "_blank", "noopener")
  }

  const publish = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    if (repo.kind === "local") {
      toast.info(cloudAvailable ? "Sign in to publish" : "Publishing needs accounts", {
        description: cloudAvailable
          ? "Guest projects live only in this browser. Sign in, save, then publish to get a public link."
          : "Connect Supabase (SUPABASE_URL / SUPABASE_ANON_KEY) to enable publishing. You can still Export HTML.",
      })
      return
    }
    const saved = await save()
    if (!saved) return
    setBusy("publish")
    try {
      const next = await repo.setPublished(saved.id, !saved.published)
      setProject(next)
      if (next.published) {
        burst(button)
        const url = `${window.location.origin}/site/${next.slug}`
        toast.success("Published!", { description: url, action: { label: "Open", onClick: () => window.open(url, "_blank", "noopener") } })
      } else toast("Unpublished. The public link is offline.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't publish")
    } finally {
      setBusy(null)
    }
  }

  const exportHtml = async () => {
    if (!project || !site) return
    const clean = finalize(site, conceptToSite(project.concept))
    // Inline local AI artwork so the exported file is fully self-contained.
    if (clean.brand.mascotImage?.startsWith("asset:")) {
      clean.brand = { ...clean.brand, mascotImage: (await assetRefToDataUrl(clean.brand.mascotImage)) ?? undefined }
    }
    downloadFile(`${project.slug}.html`, renderSiteHTML(clean), "text/html")
    toast.success("Exported a standalone HTML file")
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-8 animate-spin text-lab" />
      </div>
    )
  }
  if (status === "missing" || !project || !site) {
    return (
      <div className="grid min-h-dvh place-items-center p-4">
        <EmptyState
          emoji="🔍"
          title="Project not found"
          description={user ? "It may have been deleted." : "Guest projects are stored per browser. If you created it elsewhere, sign in there to sync."}
          action={<ButtonLink href="/dashboard/websites" variant="glow" size="lg" className="px-4">Back to my websites</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <ButtonLink href="/dashboard/websites" variant="ghost" size="icon" aria-label="Back to dashboard">
          <ArrowLeft />
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {site.brand.mascot} {site.brand.name}
            {dirty && <span className="ml-2 text-xs font-normal text-muted-foreground">• unsaved</span>}
          </p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{project.published ? `/site/${project.slug}` : site.brand.domain}</p>
        </div>
        <div className="hidden items-center rounded-lg border border-border p-0.5 md:flex" role="radiogroup" aria-label="Preview device">
          {(["desktop", "mobile"] as const).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} aria-label={d} onClick={() => setDevice(d)} className={cn("rounded-md p-1.5", device === d ? "bg-foreground/10" : "text-muted-foreground")}>
              {d === "desktop" ? <Laptop className="size-4" /> : <Smartphone className="size-4" />}
            </button>
          ))}
        </div>
        <ThemeToggle />
        <Button
          variant="glass"
          size="lg"
          onClick={(e) => {
            const button = e.currentTarget
            save().then((saved) => saved && burst(button))
          }}
          disabled={busy !== null || !dirty}
          aria-label="Save"
        >
          {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />}
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button variant="glass" size="lg" onClick={preview} aria-label="Preview">
          <Eye /> <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button variant="glass" size="lg" onClick={exportHtml} aria-label="Export">
          <Download /> <span className="hidden sm:inline">Export</span>
        </Button>
        <Button variant="glow" size="lg" className="px-3" onClick={(e) => publish(e)} disabled={busy !== null}>
          {busy === "publish" ? <Loader2 className="animate-spin" /> : <Globe />}
          <span className="hidden sm:inline">{project.published ? "Unpublish" : "Publish"}</span>
        </Button>
      </header>

      {/* Mobile pane switcher */}
      <div className="grid grid-cols-3 gap-1 border-b border-border p-1.5 lg:hidden" role="tablist">
        {(["sections", "preview", "style"] as const).map((p) => (
          <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cn("rounded-lg py-1.5 text-sm capitalize", pane === p ? "bg-lab-fill font-semibold text-lab-ink" : "text-muted-foreground")}>
            {p}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Sections" className={cn("w-full shrink-0 overflow-y-auto border-r border-border lg:block lg:w-72", pane === "sections" ? "block" : "hidden")}>
          <SectionPanel site={site} active={active} onActive={setActive} update={update} />
        </aside>

        <main className={cn("min-w-0 flex-1 overflow-hidden bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:24px_24px] lg:block", pane === "preview" ? "block" : "hidden")}>
          <div className="flex h-full justify-center overflow-y-auto p-3 sm:p-6">
            <div className={cn("h-fit w-full overflow-hidden rounded-2xl border border-border shadow-2xl transition-[max-width] duration-300", device === "mobile" ? "max-w-[390px]" : "max-w-6xl")}>
              <MemeSite
                config={site}
                activeSection={active === "brand" ? null : (active as SiteSectionId)}
                onSelectSection={(id) => {
                  setActive(id)
                  if (window.innerWidth < 1024) setPane("sections")
                }}
              />
            </div>
          </div>
        </main>

        <aside aria-label="Style" className={cn("w-full shrink-0 overflow-y-auto border-l border-border lg:block lg:w-80", pane === "style" ? "block" : "hidden")}>
          <StylePanel
            theme={site.theme}
            concept={project.concept}
            mascot={site.brand.mascot}
            template={site.template ?? "classic"}
            mascotImage={site.brand.mascotImage}
            onMascotImage={(ref) => update((s) => ({ ...s, brand: { ...s.brand, mascotImage: ref } }))}
            onTemplate={(id) =>
              update((s) => ({
                ...s,
                template: id,
                // Classic returns to the brand's own palette; other templates apply their preset.
                theme: { ...s.theme, ...(id === "classic" ? conceptToSite(project.concept).theme : templateById(id).preset) },
              }))
            }
            onMascot={(m) => update((s) => ({ ...s, brand: { ...s.brand, mascot: m } }))}
            onChange={(patch) => update((s) => ({ ...s, theme: { ...s.theme, ...patch } }))}
          />
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">{dirty ? "Unsaved changes" : "All changes saved"}</p>
    </div>
  )
}
