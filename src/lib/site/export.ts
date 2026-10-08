import type { SiteConfig } from "@/lib/types"
import { TEMPLATE_CSS } from "./templates"

const FONT_STACK: Record<SiteConfig["theme"]["font"], { css: string; google?: string }> = {
  bricolage: { css: "'Bricolage Grotesque', system-ui, sans-serif", google: "Bricolage+Grotesque:wght@400;700;800" },
  inter: { css: "'Inter', system-ui, sans-serif", google: "Inter:wght@400;600;800" },
  rounded: { css: "'Nunito', ui-rounded, system-ui, sans-serif", google: "Nunito:wght@400;700;900" },
  mono: { css: "'JetBrains Mono', ui-monospace, monospace", google: "JetBrains+Mono:wght@400;700;800" },
  serif: { css: "Georgia, 'Times New Roman', serif" },
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Only inlined data URLs or https images are allowed in the standalone file. */
const imgSrc = (u: string | undefined) => (u && /^(data:image\/|https:\/\/)/.test(u) ? esc(u) : "")
const safeUrl = (u: string) => (/^https:\/\//i.test(u) ? esc(u) : "#")
const safeColor = (c: string, fallback: string) => (/^#[0-9a-f]{3,8}$/i.test(c) ? c : fallback)

/** Render a standalone, dependency-free HTML file for a generated meme website. */
export function renderSiteHTML(config: SiteConfig): string {
  const t = config.theme
  const font = FONT_STACK[t.font] ?? FONT_STACK.bricolage
  const c = {
    primary: safeColor(t.primary, "#A855F7"),
    secondary: safeColor(t.secondary, "#22D3EE"),
    accent: safeColor(t.accent, "#39FF88"),
    bg: safeColor(t.background, "#0B0912"),
    text: safeColor(t.text, "#FFFFFF"),
  }
  const radius = Math.max(0, Math.min(48, Number(t.radius) || 0))
  const btnShape = t.buttonStyle === "pill" ? "999px" : t.buttonStyle === "brutal" ? "0" : `${radius}px`
  const mascotAnim = t.animation === "bouncy" ? "wobble 2.2s ease-in-out infinite" : t.animation === "subtle" ? "bob 4s ease-in-out infinite" : "none"
  const s = config.sections
  const b = config.brand
  const art = imgSrc(b.mascotImage) || imgSrc(b.mascot)

  const links = (["x", "telegram", "discord"] as const)
    .map((k) => {
      const label = { x: "X / Twitter", telegram: "Telegram", discord: "Discord" }[k]
      const href = config.community.links[k]
      return href
        ? `<a class="btn ms-btn ${k === "x" ? "primary ms-btn-primary" : ""}" href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<span class="btn ms-btn">${label} <small>(link soon)</small></span>`
    })
    .join("")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(b.name)} ($${esc(b.ticker)}): ${esc(config.hero.subheadline)}</title>
<meta name="description" content="${esc(config.hero.subheadline)} Built with FunCoin Lab." />
${font.google ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap">` : ""}
<style>
:root{--p:${c.primary};--s:${c.secondary};--a:${c.accent};--bg:${c.bg};--t:${c.text};--r:${radius}px;--s-primary:var(--p);--s-secondary:var(--s);--s-accent:var(--a);--s-bg:var(--bg);--s-text:var(--t);--s-radius:var(--r)}
*{box-sizing:border-box;margin:0}
body{font-family:${font.css};color:var(--t);background:${
    t.backgroundStyle === "gradient"
      ? `radial-gradient(60% 50% at 15% 0%, color-mix(in srgb, var(--p) 45%, transparent), transparent), radial-gradient(50% 40% at 90% 20%, color-mix(in srgb, var(--s) 35%, transparent), transparent), var(--bg)`
      : "var(--bg)"
  };${t.backgroundStyle === "grid" ? "background-image:linear-gradient(color-mix(in srgb,var(--t) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--t) 7%,transparent) 1px,transparent 1px);background-size:40px 40px;" : ""}line-height:1.55}
a{color:inherit}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;font-weight:800}
header small{border:1px solid color-mix(in srgb,var(--t) 25%,transparent);border-radius:999px;padding:4px 12px;font-weight:500;opacity:.8}
.hero{display:flex;flex-wrap:wrap;align-items:center;gap:32px;padding:56px 20px 88px}
.hero>div{flex:1 1 380px}
.tag{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t);background:color-mix(in srgb,var(--a) 35%,transparent);border:1px solid color-mix(in srgb,var(--a) 60%,transparent)}
h1{font-size:clamp(2.4rem,6vw,4rem);line-height:1.02;font-weight:900;letter-spacing:-.03em;margin:18px 0}
h2{font-size:clamp(1.8rem,4vw,2.5rem);font-weight:900;text-align:center;letter-spacing:-.02em}
.sub{font-size:1.15rem;opacity:.85}.quote{color:var(--s);font-style:italic;font-weight:600;margin:14px 0 24px}
.btns{display:flex;flex-wrap:wrap;gap:12px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:12px 22px;font-weight:800;font-size:14px;text-decoration:none;border-radius:${btnShape};background:color-mix(in srgb,var(--t) 12%,transparent);${t.buttonStyle === "brutal" ? "border:2px solid #000;box-shadow:4px 4px 0 #000;" : ""}${t.buttonStyle === "outline" ? "background:transparent;border:2px solid currentColor;" : ""}}
.btn.primary{${t.buttonStyle === "outline" ? "color:var(--p);border-color:var(--p)" : "background:var(--p);color:#fff"}}
.btn small{font-size:10px;opacity:.6}
.mascot{font-size:${Math.max(80, Math.min(260, t.mascotSize))}px;line-height:1;animation:${mascotAnim};text-align:center;flex:0 0 auto;filter:drop-shadow(0 20px 40px color-mix(in srgb,var(--p) 60%,transparent))}
section{padding:56px 0}
.card{border:1px solid color-mix(in srgb,var(--t) 14%,transparent);background:color-mix(in srgb,var(--t) 5%,transparent);border-radius:var(--r);padding:20px}
.lore{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:720px;margin:32px auto 0;text-align:center}
.lore .arrow{color:var(--s);font-size:24px}.kicker{color:var(--a);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.grid{display:grid;gap:14px;margin-top:32px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.meme{overflow:hidden;padding:0}.meme div{aspect-ratio:4/3;display:grid;place-items:center;font-size:72px}.meme p{padding:16px;font-size:14px;font-weight:600}
dt{font-size:12px;text-transform:uppercase;opacity:.6}dd{font-size:18px;font-weight:800;margin:4px 0 0}
.note{text-align:center;font-size:12px;opacity:.7;max-width:640px;margin:18px auto 0}
.badge{display:inline-block;border:1px solid currentColor;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:800;text-transform:uppercase;opacity:.8}
footer{border-top:1px solid color-mix(in srgb,var(--t) 12%,transparent);padding:32px 20px;text-align:center;font-size:14px;opacity:.8}
.legal{text-align:center;font-size:11px;opacity:.6;padding:0 20px 24px}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes wobble{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) scale(1.08)}}
@media (prefers-reduced-motion:reduce){.mascot{animation:none}}
.hero{flex-direction:row}
${TEMPLATE_CSS}
</style>
</head>
<body class="ms-root" data-template="${esc(config.template ?? "classic")}">
<header><span style="display:flex;align-items:center;gap:8px">${art ? `<img src="${art}" alt="" width="32" height="32" style="object-fit:contain" />` : ""}$${esc(b.ticker)}</span><small>${esc(b.domain)}</small></header>
${
  s.hero
    ? `<div class="wrap hero ms-hero"><div class="ms-hero-copy" style="display:flex;flex-direction:column;align-items:flex-start"><span class="tag ms-tag">$${esc(b.ticker)}</span><h1 class="ms-h1">${esc(config.hero.headline)}</h1><p class="sub">${esc(
        config.hero.subheadline,
      )}</p><p class="quote ms-quote">“${esc(config.hero.quote)}”</p><div class="btns"><a class="btn primary ms-btn ms-btn-primary" href="#community">${esc(
        config.hero.primaryCta,
      )}</a><a class="btn ms-btn" href="#memes">${esc(config.hero.secondaryCta)}</a></div></div><div class="ms-mascot-wrap">${
        art
          ? `<img class="mascot ms-mascot" src="${art}" alt="${esc(b.name)} mascot" style="width:${Math.round(t.mascotSize * 1.6)}px;height:auto;object-fit:contain;font-size:0${b.mascotImage ? ";border-radius:2rem" : ""}" />`
          : ""
      }</div></div>`
    : ""
}
${
  s.about
    ? `<section id="about"><div class="wrap ms-section" style="max-width:760px"><h2 class="ms-h2">${esc(config.about.title)}</h2>${config.about.body
        .split(/\n{2,}/)
        .map((p) => `<p style="margin-top:16px;opacity:.85">${esc(p)}</p>`)
        .join("")}</div></section>`
    : ""
}
${
  s.lore
    ? `<section id="lore"><div class="wrap ms-section"><h2 class="ms-h2">${esc(config.lore.title)}</h2><div class="lore">${config.lore.steps
        .map(
          (st, i) =>
            `<div class="card ms-card" style="width:100%"><div class="kicker">Chapter ${i + 1}</div><h3>${esc(st.title)}</h3><p style="opacity:.8;font-size:14px;margin-top:6px">${esc(
              st.text,
            )}</p></div>${i < config.lore.steps.length - 1 ? '<div class="arrow">↓</div>' : ""}`,
        )
        .join("")}</div></div></section>`
    : ""
}
${
  s.token
    ? `<section id="token"><div class="wrap ms-section"><h2 class="ms-h2">${esc(config.token.title)} <span class="badge">${config.token.contract ? "Live" : "Launching soon"}</span></h2><dl class="grid">${[
        ["Name", b.name],
        ["Ticker", `$${b.ticker}`],
        ["Network", config.token.network],
        ["Supply", config.token.supply],
      ]
        .map(([k, v]) => `<div class="card ms-card"><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
        .join("")}</dl>${config.token.contract ? `<div class="card" style="margin-top:12px;text-align:center"><dt>Contract address</dt><dd style="font-family:ui-monospace,monospace;font-size:14px;word-break:break-all">${esc(config.token.contract)}</dd></div>` : ""}<p class="note">${esc(config.token.note)}</p></div></section>`
    : ""
}
${
  s.memes
    ? `<section id="memes"><div class="wrap ms-section"><h2 class="ms-h2">${esc(config.memes.title)}</h2><div class="grid">${config.memes.items
        .map(
          (m, i) =>
            `<figure class="card meme ms-card"><div style="background:linear-gradient(135deg,${[c.primary, c.secondary, c.accent][i % 3]},var(--bg))">${imgSrc(m.image) || art ? `<img src="${imgSrc(m.image) || art}" alt="" style="height:72%;width:auto;object-fit:contain" />` : ""}</div><p>${esc(m.caption)}</p></figure>`,
        )
        .join("")}</div></div></section>`
    : ""
}
${
  s.community
    ? `<section id="community"><div class="wrap ms-section" style="text-align:center"><h2 class="ms-h2">${esc(config.community.title)}</h2><p style="opacity:.8;margin-top:10px">${esc(
        config.community.subtitle,
      )}</p><div class="btns" style="justify-content:center;margin-top:28px">${links}</div></div></section>`
    : ""
}
${s.footer ? `<footer class="ms-footer">${esc(config.footer.text)}</footer>` : ""}
<p class="legal">Not financial advice. Crypto assets are highly risky: only spend what you can afford to lose, and always verify the contract address.</p>
</body>
</html>
`
}
