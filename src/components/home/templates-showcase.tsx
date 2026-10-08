"use client"
import { useMemo, useState } from "react"
import { MemeSite } from "@/components/site/meme-site"
import { BrowserFrame } from "./site-showcase"
import { SITE_TEMPLATES, templateById } from "@/lib/site/templates"
import type { SiteConfig, SiteTemplateId } from "@/lib/types"
import { cn } from "@/lib/utils"

/** The same generated site in each of the five website templates. */
export function TemplatesShowcase({ site }: { site: SiteConfig }) {
  const [id, setId] = useState<SiteTemplateId>("classic")
  const shown = useMemo<SiteConfig>(
    () => ({ ...site, template: id, theme: { ...site.theme, ...(id === "classic" ? {} : templateById(id).preset) } }),
    [site, id],
  )

  return (
    <section aria-labelledby="templates-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
      <h2 id="templates-title" className="max-w-2xl font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
        A website in five styles
      </h2>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">Every brand comes with an editable landing page. Pick a look, change any word, publish or export the HTML.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <div role="tablist" aria-label="Website templates" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {SITE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={id === t.id}
              onClick={() => setId(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors lg:w-full",
                id === t.id ? "border-transparent bg-lab-fill text-lab-ink" : "border-border hover:border-lab-fill/60",
              )}
            >
              <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                {t.swatch.map((c) => (
                  <span key={c} className="size-4 rounded-full border border-black/20" style={{ background: c }} />
                ))}
              </span>
              <span>
                <span className="block text-sm font-semibold whitespace-nowrap">{t.name}</span>
                <span className={cn("hidden text-xs lg:block", id === t.id ? "text-lab-ink/75" : "text-muted-foreground")}>{t.description}</span>
              </span>
            </button>
          ))}
        </div>

        <BrowserFrame url={shown.brand.domain}>
          <div role="tabpanel" className="h-[460px] overflow-y-auto overscroll-contain sm:h-[560px]">
            <MemeSite config={shown} embedded />
          </div>
        </BrowserFrame>
      </div>
    </section>
  )
}
