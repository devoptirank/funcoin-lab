import type { SiteConfig, SiteTemplateId } from "@/lib/types"

export type { SiteTemplateId }

/**
 * Website templates for generated meme sites.
 *
 * A template = a theme preset (colors, font, buttons…) + a stylesheet that changes layout,
 * typography and motion. The SAME stylesheet is used by the live renderer (MemeSite) and the
 * HTML export, both of which tag elements with stable `ms-*` class names and set
 * `data-template` on the root. Styles read the site's CSS variables (--s-primary etc.), so the
 * user can still recolor any template in the editor.
 */

type Theme = SiteConfig["theme"]

export const SITE_TEMPLATES: {
  id: SiteTemplateId
  name: string
  description: string
  pro: boolean
  preset: Partial<Theme>
  swatch: [string, string, string]
}[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Split hero, soft glass cards, your brand palette.",
    pro: false,
    preset: {},
    swatch: ["#0b0912", "#c6f432", "#7b5cff"],
  },
  {
    id: "sticker-bomb",
    name: "Sticker Bomb",
    description: "Tilted sticker cards, thick outlines, hard shadows.",
    pro: false,
    preset: {
      primary: "#FF4D2E",
      secondary: "#2E6BFF",
      accent: "#FFD60A",
      background: "#FFF3C4",
      text: "#111111",
      font: "bricolage",
      radius: 18,
      buttonStyle: "brutal",
      backgroundStyle: "solid",
      animation: "bouncy",
    },
    swatch: ["#FFF3C4", "#FF4D2E", "#2E6BFF"],
  },
  {
    id: "neon-arcade",
    name: "Neon Arcade",
    description: "Scanlines, glowing type and a flickering marquee headline.",
    pro: true,
    preset: {
      primary: "#FF2BD6",
      secondary: "#00F0FF",
      accent: "#F9FF00",
      background: "#07040F",
      text: "#F5F3FF",
      font: "mono",
      radius: 4,
      buttonStyle: "outline",
      backgroundStyle: "grid",
      animation: "bouncy",
    },
    swatch: ["#07040F", "#FF2BD6", "#00F0FF"],
  },
  {
    id: "y2k-chrome",
    name: "Y2K Chrome",
    description: "Liquid-chrome headlines, glossy bubbles, pill buttons.",
    pro: true,
    preset: {
      primary: "#3B5BFF",
      secondary: "#FF6AD5",
      accent: "#7FE9FF",
      background: "#E7EAF4",
      text: "#0D0F1A",
      font: "rounded",
      radius: 28,
      buttonStyle: "pill",
      backgroundStyle: "gradient",
      animation: "subtle",
    },
    swatch: ["#E7EAF4", "#3B5BFF", "#FF6AD5"],
  },
  {
    id: "minimal-luxe",
    name: "Minimal Luxe",
    description: "Quiet serif type, hairlines and lots of air.",
    pro: true,
    preset: {
      primary: "#ECE8DF",
      secondary: "#9C978C",
      accent: "#B9C0C9",
      background: "#0F0F0F",
      text: "#ECE8DF",
      font: "serif",
      radius: 2,
      buttonStyle: "outline",
      backgroundStyle: "solid",
      animation: "subtle",
      mascotSize: 110,
    },
    swatch: ["#0F0F0F", "#ECE8DF", "#B9C0C9"],
  },
]

export const templateById = (id: SiteTemplateId | undefined) => SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0]

const T = (id: SiteTemplateId) => `.ms-root[data-template="${id}"]`

/** Shared template stylesheet. Unlayered, so it wins over utility classes in the live renderer. */
export const TEMPLATE_CSS = `
/* Generated sites use their own font choice everywhere, including headings. */
.ms-root h1, .ms-root h2, .ms-root h3 { font-family: inherit; }
@keyframes ms-flicker { 0%, 19%, 22%, 62%, 64%, 100% { opacity: 1 } 20%, 63% { opacity: .55 } }
@keyframes ms-shine { 0% { background-position: -150% 0 } 60%, 100% { background-position: 250% 0 } }
@keyframes ms-sticker { 0%, 100% { transform: rotate(var(--ms-rot, -2deg)) } 50% { transform: rotate(calc(var(--ms-rot, -2deg) * -1)) } }

/* ---------- Sticker Bomb ---------- */
${T("sticker-bomb")} .ms-h1, ${T("sticker-bomb")} .ms-h2 { letter-spacing: -0.03em; }
${T("sticker-bomb")} .ms-h2 { display: table; margin-inline: auto; padding: .15em .5em; background: var(--s-accent); color: #111; border: 3px solid #111; box-shadow: 5px 5px 0 #111; transform: rotate(-2deg); }
${T("sticker-bomb")} .ms-card { border: 3px solid #111 !important; box-shadow: 6px 6px 0 #111; background: #fff !important; color: #111; }
${T("sticker-bomb")} .ms-card:nth-child(odd) { --ms-rot: -1.6deg; transform: rotate(-1.6deg); }
${T("sticker-bomb")} .ms-card:nth-child(even) { --ms-rot: 1.4deg; transform: rotate(1.4deg); }
${T("sticker-bomb")} .ms-mascot-wrap { background: #fff; border: 4px solid #111; border-radius: 9999px; padding: .35em; box-shadow: 8px 8px 0 #111; }
${T("sticker-bomb")} .ms-tag { background: #111 !important; color: #fff !important; border-radius: 4px !important; }
${T("sticker-bomb")} .ms-quote { color: var(--s-primary) !important; }
@media (prefers-reduced-motion: no-preference) {
  ${T("sticker-bomb")} .ms-card:hover { animation: ms-sticker .5s ease-in-out 2; }
}

/* ---------- Neon Arcade ---------- */
${T("neon-arcade")} { position: relative; }
${T("neon-arcade")}::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px); mix-blend-mode: multiply; }
${T("neon-arcade")} .ms-h1, ${T("neon-arcade")} .ms-h2 { text-transform: uppercase; letter-spacing: .02em; color: var(--s-text); text-shadow: 0 0 6px var(--s-primary), 0 0 22px var(--s-primary), 0 0 44px var(--s-secondary); }
${T("neon-arcade")} .ms-hero { flex-direction: column-reverse !important; text-align: center; }
${T("neon-arcade")} .ms-hero-copy { align-items: center !important; }
${T("neon-arcade")} .ms-hero > * { flex: 0 0 auto !important; }
${T("neon-arcade")} .ms-card { background: transparent !important; border: 1px solid var(--s-secondary) !important; box-shadow: 0 0 0 1px color-mix(in srgb, var(--s-secondary) 30%, transparent), inset 0 0 24px color-mix(in srgb, var(--s-secondary) 18%, transparent); }
${T("neon-arcade")} .ms-btn { text-transform: uppercase; letter-spacing: .08em; box-shadow: 0 0 14px color-mix(in srgb, var(--s-primary) 60%, transparent); }
${T("neon-arcade")} .ms-mascot { filter: drop-shadow(0 0 18px var(--s-primary)) drop-shadow(0 0 40px var(--s-secondary)); }
@media (prefers-reduced-motion: no-preference) {
  ${T("neon-arcade")} .ms-h1 { animation: ms-flicker 4s linear infinite; }
}

/* ---------- Y2K Chrome ---------- */
${T("y2k-chrome")} .ms-h1, ${T("y2k-chrome")} .ms-h2 {
  background: linear-gradient(180deg, #ffffff 0%, #dfe5f1 28%, #3f4a63 50%, #c4cde0 58%, #6c7891 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-stroke: 1.5px color-mix(in srgb, var(--s-text) 60%, transparent);
  filter: drop-shadow(0 3px 0 color-mix(in srgb, var(--s-primary) 55%, transparent));
}
${T("y2k-chrome")} .ms-hero { flex-direction: row-reverse; }
${T("y2k-chrome")} .ms-card { background: linear-gradient(160deg, rgba(255,255,255,.95), rgba(255,255,255,.55)) !important; border: 1px solid rgba(255,255,255,.9) !important; box-shadow: inset 0 2px 0 #fff, inset 0 -6px 14px rgba(59,91,255,.12), 0 14px 30px -18px rgba(13,15,26,.45); color: var(--s-text); }
${T("y2k-chrome")} .ms-btn { position: relative; overflow: hidden; box-shadow: inset 0 2px 0 rgba(255,255,255,.6), 0 8px 18px -10px var(--s-primary); background-image: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%) !important; background-size: 250% 100%; background-repeat: no-repeat; }
${T("y2k-chrome")} .ms-btn-primary { background-color: var(--s-primary) !important; }
${T("y2k-chrome")} .ms-mascot-wrap { background: radial-gradient(circle at 35% 30%, #fff, color-mix(in srgb, var(--s-accent) 60%, #fff) 45%, color-mix(in srgb, var(--s-primary) 35%, #fff)); border-radius: 9999px; padding: .3em; box-shadow: inset 0 -10px 24px rgba(59,91,255,.25), 0 20px 40px -20px rgba(13,15,26,.5); }
@media (prefers-reduced-motion: no-preference) {
  ${T("y2k-chrome")} .ms-btn { animation: ms-shine 3.5s ease-in-out infinite; }
}

/* ---------- Minimal Luxe ---------- */
${T("minimal-luxe")} .ms-h1 { font-weight: 400 !important; letter-spacing: -0.01em; }
${T("minimal-luxe")} .ms-h2 { font-weight: 400 !important; font-size: clamp(1.6rem, 3vw, 2.2rem); letter-spacing: 0; }
${T("minimal-luxe")} .ms-hero { flex-direction: column !important; text-align: center; padding-block: 6rem !important; }
${T("minimal-luxe")} .ms-hero-copy { align-items: center !important; }
${T("minimal-luxe")} .ms-hero > * { flex: 0 0 auto !important; }
${T("minimal-luxe")} .ms-tag { background: transparent !important; color: var(--s-secondary) !important; letter-spacing: .3em !important; }
${T("minimal-luxe")} .ms-card { background: transparent !important; border: 0 !important; border-top: 1px solid color-mix(in srgb, var(--s-text) 22%, transparent) !important; border-radius: 0 !important; box-shadow: none !important; }
${T("minimal-luxe")} .ms-quote { color: var(--s-secondary) !important; font-weight: 400 !important; }
${T("minimal-luxe")} .ms-btn { letter-spacing: .14em; text-transform: uppercase; font-weight: 500 !important; font-size: .75rem !important; }
${T("minimal-luxe")} .ms-section { padding-block: 5rem !important; }
`
