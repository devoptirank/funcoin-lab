"use client"
import type { CSSProperties } from "react"
import type { SiteConfig, SiteFont, SiteSectionId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TEMPLATE_CSS } from "@/lib/site/templates"
import { useAssetUrl } from "@/lib/assets/store"
import { MascotArt } from "@/components/shared/mascot-art"

export const SITE_FONTS: Record<SiteFont, { label: string; stack: string }> = {
  bricolage: { label: "Bricolage (bold display)", stack: "var(--font-display), system-ui, sans-serif" },
  inter: { label: "Geist (clean)", stack: "var(--font-geist-sans), system-ui, sans-serif" },
  rounded: { label: "Rounded (friendly)", stack: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif" },
  mono: { label: "Mono (hacker)", stack: "var(--font-geist-mono), ui-monospace, monospace" },
  serif: { label: "Serif (fancy)", stack: "Georgia, 'Times New Roman', serif" },
}

type Props = {
  config: SiteConfig
  /** Editor mode: sections become clickable and the active one is outlined. */
  activeSection?: SiteSectionId | null
  onSelectSection?: (id: SiteSectionId) => void
  className?: string
}

export function MemeSite({ config, activeSection, onSelectSection, className }: Props) {
  const { theme: t, brand } = config
  const vars = {
    "--s-primary": t.primary,
    "--s-secondary": t.secondary,
    "--s-accent": t.accent,
    "--s-bg": t.background,
    "--s-text": t.text,
    "--s-radius": `${t.radius}px`,
    fontFamily: SITE_FONTS[t.font]?.stack,
  } as CSSProperties

  const anim = t.animation
  const bgStyle: CSSProperties =
    t.backgroundStyle === "gradient"
      ? {
          background: `radial-gradient(60% 50% at 15% 0%, color-mix(in srgb, ${t.primary} 45%, transparent), transparent), radial-gradient(50% 40% at 90% 20%, color-mix(in srgb, ${t.secondary} 35%, transparent), transparent), ${t.background}`,
        }
      : t.backgroundStyle === "grid"
        ? {
            backgroundColor: t.background,
            backgroundImage: `linear-gradient(color-mix(in srgb, ${t.text} 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${t.text} 7%, transparent) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }
        : t.backgroundStyle === "stars"
          ? {
              backgroundColor: t.background,
              backgroundImage: `radial-gradient(2px 2px at 20px 30px, ${t.text}, transparent), radial-gradient(1px 1px at 90px 120px, ${t.accent}, transparent), radial-gradient(1.5px 1.5px at 160px 60px, ${t.secondary}, transparent)`,
              backgroundSize: "200px 160px",
            }
          : { background: t.background }

  const section = (id: SiteSectionId, children: React.ReactNode, extra?: string) =>
    config.sections[id] ? (
      <section
        id={`site-${id}`}
        data-section={id}
        onClick={onSelectSection ? () => onSelectSection(id) : undefined}
        className={cn(
          "relative",
          extra,
          onSelectSection && "cursor-pointer outline-2 -outline-offset-2 outline-transparent transition-[outline-color] hover:outline-[color-mix(in_srgb,var(--s-accent)_50%,transparent)]",
          activeSection === id && "outline-[var(--s-accent)]! outline-dashed",
        )}
      >
        {children}
      </section>
    ) : null

  return (
    <div
      style={{ ...vars, ...bgStyle, color: t.text }}
      data-template={config.template ?? "classic"}
      className={cn("ms-root @container min-h-full w-full overflow-hidden", className)}
    >
      {/* Deduplicated by React 19: one copy of the template stylesheet however many previews render. */}
      <style href="ms-templates" precedence="default">
        {TEMPLATE_CSS}
      </style>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 @3xl:px-10">
        <div className="flex items-center gap-2 font-extrabold">
          <MascotArt value={brand.mascotImage || brand.mascot} className="size-8" />
          <span>${brand.ticker}</span>
        </div>
        <nav className="hidden gap-5 text-sm opacity-80 @2xl:flex">
          {config.sections.about && <a href="#site-about">About</a>}
          {config.sections.lore && <a href="#site-lore">Lore</a>}
          {config.sections.memes && <a href="#site-memes">Memes</a>}
          {config.sections.community && <a href="#site-community">Community</a>}
        </nav>
        <span className="rounded-full border border-current/20 px-3 py-1 text-xs opacity-80">{brand.domain}</span>
      </header>

      {section(
        "hero",
        <div className="ms-hero mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 pt-10 pb-16 text-center @3xl:flex-row @3xl:text-left @3xl:pt-16 @3xl:pb-24">
          <div className="ms-hero-copy flex flex-1 flex-col items-center gap-5 @3xl:items-start">
            <span className="ms-tag rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase" style={{ background: "color-mix(in srgb, var(--s-accent) 35%, transparent)", border: "1px solid color-mix(in srgb, var(--s-accent) 60%, transparent)", color: t.text }}>
              ${brand.ticker}
            </span>
            <h1 className="ms-h1 text-4xl leading-[1.02] font-black tracking-tight @3xl:text-6xl">{config.hero.headline}</h1>
            <p className="max-w-xl text-lg opacity-85">{config.hero.subheadline}</p>
            <p className="ms-quote text-base font-semibold italic" style={{ color: t.secondary }}>
              “{config.hero.quote}”
            </p>
            <div className="flex flex-wrap justify-center gap-3 @3xl:justify-start">
              <SiteButton style={t.buttonStyle} href="#site-community" primary>
                {config.hero.primaryCta}
              </SiteButton>
              <SiteButton style={t.buttonStyle} href="#site-memes">
                {config.hero.secondaryCta}
              </SiteButton>
            </div>
          </div>
          <div className="ms-mascot-wrap relative grid place-items-center">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${t.primary}, transparent 70%)`, opacity: 0.6 }}
              aria-hidden
            />
{brand.mascotImage ? (
              <MascotImage refValue={brand.mascotImage} size={t.mascotSize} animation={anim} name={brand.name} />
            ) : (
              <MascotArt
                value={brand.mascot}
                alt={`${brand.name} mascot`}
                className="ms-mascot relative h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
                style={{
                  width: Math.round(t.mascotSize * 1.6),
                  animation: anim === "bouncy" ? "fc-wobble 2.2s ease-in-out infinite" : anim === "subtle" ? "fc-bob 4s ease-in-out infinite" : undefined,
                }}
              />
            )}
          </div>
        </div>,
      )}

      {section(
        "about",
        <div className="ms-section mx-auto max-w-3xl px-5 py-14">
          <SiteHeading>{config.about.title}</SiteHeading>
          <div className="mt-5 space-y-4 text-base leading-relaxed opacity-85">
            {config.about.body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>,
      )}

      {section(
        "lore",
        <div className="ms-section mx-auto max-w-3xl px-5 py-14">
          <SiteHeading>{config.lore.title}</SiteHeading>
          <ol className="mt-8 flex flex-col items-center gap-2">
            {config.lore.steps.map((step, i) => (
              <li key={i} className="flex w-full flex-col items-center gap-2">
                <div className="ms-card w-full border p-5 text-center" style={{ borderRadius: "var(--s-radius)", borderColor: "color-mix(in srgb, var(--s-text) 14%, transparent)", background: "color-mix(in srgb, var(--s-text) 5%, transparent)" }}>
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: t.accent }}>
                    Chapter {i + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm opacity-80">{step.text}</p>
                </div>
                {i < config.lore.steps.length - 1 && (
                  <span className="text-2xl" style={{ color: t.secondary }} aria-hidden>↓</span>
                )}
              </li>
            ))}
          </ol>
        </div>,
      )}

      {section(
        "token",
        <div className="ms-section mx-auto max-w-4xl px-5 py-14">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SiteHeading>{config.token.title}</SiteHeading>
            <span className="rounded-full border border-current/30 px-2.5 py-0.5 text-xs font-bold uppercase">{config.token.contract ? "Live" : "Launching soon"}</span>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
            {[
              ["Name", brand.name],
              ["Ticker", `$${brand.ticker}`],
              ["Network", config.token.network],
              ["Supply", config.token.supply],
            ].map(([k, v]) => (
              <div key={k} className="ms-card border p-4" style={{ borderRadius: "var(--s-radius)", borderColor: "color-mix(in srgb, var(--s-text) 14%, transparent)", background: "color-mix(in srgb, var(--s-text) 5%, transparent)" }}>
                <dt className="text-xs uppercase opacity-60">{k}</dt>
                <dd className="mt-1 truncate text-lg font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
          {config.token.contract && (
            <div className="ms-card mx-auto mt-3 flex max-w-2xl flex-col items-center gap-1 border p-4 text-center" style={{ borderRadius: "var(--s-radius)", borderColor: "color-mix(in srgb, var(--s-text) 14%, transparent)" }}>
              <span className="text-xs uppercase opacity-60">Contract address</span>
              <code className="font-mono text-sm break-all">{config.token.contract}</code>
            </div>
          )}
          <p className="mx-auto mt-5 max-w-2xl text-center text-xs opacity-70">{config.token.note}</p>
        </div>,
      )}

      {section(
        "memes",
        <div className="ms-section mx-auto max-w-5xl px-5 py-14">
          <SiteHeading>{config.memes.title}</SiteHeading>
          <div className="mt-8 grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            {config.memes.items.map((m, i) => (
              <figure key={i} className="ms-card overflow-hidden border" style={{ borderRadius: "var(--s-radius)", borderColor: "color-mix(in srgb, var(--s-text) 14%, transparent)" }}>
                <div
                  className="grid aspect-[4/3] place-items-center overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${[t.primary, t.secondary, t.accent][i % 3]}, ${t.background})` }}
                  aria-hidden
                >
                  <MascotArt value={m.image || brand.mascotImage || brand.mascot} className="h-[72%] w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.3)]" style={{ transform: `rotate(${[-6, 4, -2][i % 3]}deg)` }} />
                </div>
                <figcaption className="p-4 text-sm font-medium">{m.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>,
      )}

      {section(
        "community",
        <div className="ms-section mx-auto max-w-3xl px-5 py-16 text-center">
          <SiteHeading>{config.community.title}</SiteHeading>
          <p className="mt-3 opacity-80">{config.community.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {(
              [
                ["x", "X / Twitter"],
                ["telegram", "Telegram"],
                ["discord", "Discord"],
              ] as const
            ).map(([key, label]) => (
              <SiteButton key={key} style={t.buttonStyle} href={config.community.links[key] || undefined} primary={key === "x"}>
                {label}
                {!config.community.links[key] && <span className="ml-1 text-[10px] opacity-60">(link soon)</span>}
              </SiteButton>
            ))}
          </div>
        </div>,
      )}

      {section(
        "footer",
        <footer className="ms-footer border-t border-current/10 px-5 py-8 text-center text-sm opacity-75">
          <p>{config.footer.text}</p>
        </footer>,
      )}
      {/* Always present, not editable: a risk notice on every generated site. */}
      <p className="px-5 pb-6 text-center text-[11px] opacity-60">
        Not financial advice. Crypto assets are highly risky: only spend what you can afford to lose, and always verify the contract address.
      </p>
    </div>
  )
}

function SiteHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="ms-h2 text-center text-3xl font-black tracking-tight @3xl:text-4xl">{children}</h2>
}

function SiteButton({
  children,
  href,
  primary,
  style,
}: {
  children: React.ReactNode
  href?: string
  primary?: boolean
  style: SiteConfig["theme"]["buttonStyle"]
}) {
  const base = "inline-flex items-center justify-center px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
  const shape =
    style === "pill" ? "rounded-full" : style === "brutal" ? "rounded-none border-2 border-black shadow-[4px_4px_0_#000]" : "rounded-[var(--s-radius)]"
  const color =
    style === "outline"
      ? { border: `2px solid ${primary ? "var(--s-primary)" : "currentColor"}`, color: primary ? "var(--s-primary)" : undefined }
      : primary
        ? { background: "var(--s-primary)", color: "#fff" }
        : { background: "color-mix(in srgb, var(--s-text) 12%, transparent)" }
  const external = href?.startsWith("http")
  return (
    <a
      href={href ?? "#"}
      onClick={href ? undefined : (e) => e.preventDefault()}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn("ms-btn", primary && "ms-btn-primary", base, shape)}
      style={color}
    >
      {children}
    </a>
  )
}

function MascotImage({ refValue, size, animation, name }: { refValue: string; size: number; animation: SiteConfig["theme"]["animation"]; name: string }) {
  const url = useAssetUrl(refValue)
  const px = Math.round(size * 1.6)
  return (
    <span
      className="ms-mascot relative block overflow-hidden rounded-[2rem] border border-current/15 shadow-xl"
      style={{
        width: px,
        height: px,
        animation: animation === "bouncy" ? "fc-wobble 2.2s ease-in-out infinite" : animation === "subtle" ? "fc-bob 4s ease-in-out infinite" : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- generated image (object, storage or data URL) */}
      {url && <img src={url} alt={`${name} mascot`} className="size-full object-cover" />}
    </span>
  )
}
