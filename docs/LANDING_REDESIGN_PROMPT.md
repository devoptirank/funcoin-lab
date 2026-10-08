# FunCoin Lab: Landing Redesign Prompt (v3: new features, more coins, premium coin art)

> Paste everything below this line into your coding agent (Claude Code recommended). Run it from the `funcoin-lab/` folder.

---

You are redesigning the **marketing landing page of FunCoin Lab** (https://funcoinlab.com), an existing, working Next.js app in this repository. The work has four parts:

1. A new landing page with new interactive features.
2. Many more coin ideas in the Discover universe.
3. More content and landing pages for SEO.
4. A new art direction for every coin image: rich, dimensional, collectible-looking coins instead of the flat sticker-on-a-gold-rim look the current images have.

Work in the milestones at the end. Keep the app building, linting and deploying after each one.

## 0. Read first. Do not break these.

**Stack and conventions**

- Next.js **16** (App Router, Turbopack), React 19, TypeScript, Tailwind CSS **v4** (tokens in `src/app/globals.css` under `@theme`), GSAP 3 (ScrollTrigger, SplitText, `@gsap/react`), @react-three/fiber 9 with drei 10, Framer Motion, Lucide icons.
- Next 16 differs from older versions:
  - Middleware is `src/proxy.ts`.
  - `params` and `searchParams` are Promises.
  - Read `node_modules/next/dist/docs/` before using any Next API you are unsure of.
- shadcn/ui here is built on **Base UI, not Radix**. Use the `render` prop, never `asChild`. Link-buttons use `src/components/shared/button-link.tsx`.
- The design skills in `.claude/skills/` (`design-taste-frontend`, `redesign-existing-projects`) apply. Run their audit before you change any layout.
- The visual identity stays: dark-first, one lime accent (`--lab`, `--lab-fill`, `--lab-ink`), violet glow, Bricolage Grotesque headings, film grain. Evolve it; don't replace it.

**Two hosts, one deployment** (`src/lib/hosts.ts`, `src/proxy.ts`)

- `funcoinlab.com` serves marketing: home, `/discover`, `/pricing`, `/about`, the SEO pages (`src/app/(site)/[seoSlug]`), legal pages and published sites.
- `app.funcoinlab.com` serves the wallet-gated app: `/create`, `/domains`, `/logo`, `/memes`, `/social`, `/content`, `/dashboard/*`, `/editor`, `/preview`.
- **Every link from the marketing site into the app goes through `toAppUrl()`.** `ButtonLink` already does this. Plain `<Link>` and `router.push` do not, so wrap them yourself. A relative `/create` link on the marketing host causes cross-origin prefetch errors.
- Accounts are Solana wallets only. "Launch app" connects, signs in, then opens the app (`ensureSignedIn({ goToApp: true })`). There is no email login and no guest mode. Don't add either.

**Content rules (product principles, non-negotiable)**

- No prices, market caps, charts, "100x", "to the moon", guaranteed returns or any promise that something will gain value.
- No fake statistics, user counts, testimonials or logos of companies that don't use the product. If social proof is needed, use real numbers from the database or leave the section out.
- No real people, celebrities, politicians, real brands or trademarks in names or art. Every mascot is original.
- No emojis anywhere in the UI or generated copy. Use the mascot and coin images, and Lucide icons.
- Keep the "not financial advice" disclaimer link and the risk notices.
- The owner plans to launch the FunCoin Lab token on this platform later. You may add a **"FunCoin Lab token: coming later"** teaser with an email-free waitlist (connect a wallet to join). It must contain no price, supply promises or expected value, and it must link to `/disclaimer`.

**SEO (keep and extend)**

- `pageMetadata()` in `src/lib/seo.ts` sets the title, description, canonical URL, Open Graph and Twitter tags, and **must include `OG_IMAGE`**. A page that sets `openGraph` without images loses the preview image, and links then share as a blank card.
- Each page has exactly one `h1`. Embedded site previews use `<MemeSite embedded />`.
- Every new marketing page goes in `src/app/sitemap.ts`. Every new SEO page gets FAQ and Breadcrumb JSON-LD, like the existing ones.
- Keep the Organization, WebSite and WebApplication JSON-LD on the home page.
- **Mobile first.** Check every section at 390px wide:
  - no section taller than its content needs;
  - no fixed `min-h` or `justify-center` on mobile cards;
  - no horizontal scroll;
  - the 3D scene stays desktop-only (`(min-width:1024px) and (pointer:fine)`), with a static poster on phones.

## 1. New landing page

Rebuild `src/app/(site)/page.tsx` and `src/components/home/*`. The target section order is below. Every section needs a mobile layout designed on purpose, not a squeezed desktop layout.

1. **Hero: "The Coin Forge."**
   - Left: the headline, the topic input and the "Launch app" button.
   - Right, on desktop: one large 3D coin. Build it with @react-three/fiber as a cylinder with a beveled rim and the art texture on its face.
   - The coin flips to a new design every few seconds. As the user types a topic, it swaps to the closest matching coin from the library (use `mascotForTopic`) with a flip animation.
   - On phones, show a pre-rendered coin image with a CSS flip instead.
   - Submitting the topic opens `toAppUrl("/create?auto=1&topic=...")`.
2. **Coin wall.**
   - An infinite, draggable gallery of every coin in the library: two rows moving in opposite directions, pausing on hover.
   - Each coin opens a quick-look sheet with its name, ticker concept, `.fun` domain, catchphrase and a "Remix this idea" link into the app.
   - Use the expanded Discover data from section 2.
3. **"One idea in, whole brand out."** Keep the scroll story (`idea-story.tsx`), but tighten it. On mobile it's a simple stacked list with no pinning and no empty space.
4. **Feature grid.** One cell each for the six tools (name and lore, `.fun` domains, logo, memes, social, website builder). Each cell has a small live demo, for example:
   - the domain cell types out names;
   - the logo cell spins a coin;
   - the meme cell cycles captions.
5. **Website templates showcase.**
   - The five site templates (classic, sticker-bomb, neon-arcade, y2k-chrome, minimal-luxe) rendered with `<MemeSite embedded />` in device frames.
   - Clicking a frame switches templates.
6. **Launch checklist.** A practical, non-financial checklist for a meme brand: name, domain, socials, art kit, website, community rules, contract-address safety. Each item links to the tool that handles it.
7. **Pricing teaser.**
   - Text tools are free; AI art uses credits.
   - Pull the credit packs from `src/lib/billing/plans.ts`. Never hard-code them.
   - Say that payment works with SOL, USDC or 100+ coins.
8. **FunCoin Lab token teaser** with the wallet waitlist, under the rules in section 0.
9. **Guides.** Cards for every SEO page, plus the new ones from section 3.
10. **FAQ.** 8 to 10 questions with FAQPage JSON-LD. Topics:
    - Is it free?
    - Do I need an account?
    - Which wallets work?
    - Is this financial advice?
    - Can I use the art commercially?
    - How do credits work?
    - Can I publish a site?
    - What is a `.fun` domain?
11. **Final call to action,** then the footer.

**Motion**

- Use GSAP for scroll choreography and Framer Motion for small UI states.
- Respect `prefers-reduced-motion`: no flips, no parallax, and static images instead.

**Performance budget**

- Lighthouse on mobile: Performance at least 85, Accessibility at least 95, SEO 100.
- Only the 3D scene and its textures load lazily, on desktop.
- The page's largest image is the coin poster, served as WebP or AVIF with `priority`.

## 2. More coin ideas (Discover universe)

Expand `src/lib/discover.ts` from 13 to **at least 48** projects. Keep the current shape:
- `slug`, `name`, `ticker`, `domain`, `tagline`, `catchphrase`, `tags`, `coin`, `mascot`, `addedAt`, `editorsPick`;
- the `remixHref` it produces.

Then:
- Add filter tags as needed: animals, food, office, internet, space, desi, gaming, sports, ai, weather, music, fantasy.
- Map each new idea to a library mascot (`src/lib/mascots.ts`, 70 keys). Add new mascot keys only where none fits.
- Give every idea its own coin image (section 4).

Starter list. Rename freely, but keep everything original and free of real brands, real people and price talk:

| Idea | Subject | Idea | Subject |
|---|---|---|---|
| Captain Toast | heroic slice of toast with a cape | Moth Lamp | moth in love with a desk lamp |
| Chai Wala Cat | cat brewing masala chai | Noodle Ninja | ramen bowl with headband |
| Penguin Payroll | penguin doing office paperwork | Cloud Nap | sleepy rain cloud |
| Retro Robo | 80s robot with cassette chest | Taco Tuesday Turtle | turtle wearing a taco shell |
| Laser Llama | llama with laser goggles | Disco Duck | duck with a mirrorball |
| Wizard Frog | frog in a starry wizard hat | Bubble Tea Bunny | bunny in a boba cup |
| Grumpy Cactus | cactus with a monocle | Space Hamster | hamster in a fishbowl helmet |
| Vada Pav Viking | vada pav with a viking helmet | Lofi Owl | owl with headphones and rain window |
| Gym Goat | goat lifting tiny dumbbells | Panda Pixel | 8-bit panda |
| Meme Monk | calm monk meditating on a phone | Sushi Sumo | sushi roll sumo wrestler |
| Couch Potato King | potato on a throne sofa | Kraken Keyboard | octopus typing on four keyboards |
| Rocket Snail | snail with a jetpack | Biryani Bear | bear guarding a biryani pot |
| Glitch Ghost | pixel ghost with scanlines | Sneaker Shark | shark in high-top sneakers |
| Dragon Dumpling | baby dragon hatching from a dumpling | Cricket Crow | crow with a cricket bat |
| Weather Wizard Dog | dog forecasting with a staff | Jelly Jetpack | jellyfish astronaut |
| Midnight Fridge | glowing fridge with eyes | Ape Architect | ape with blueprints and hard hat |
| Banana Phone | banana on a retro phone call | Cyber Samurai Cat | cat in neon armor |
| Pirate Parrot DJ | parrot DJ with eye patch | Moon Mochi | mochi floating in space |

## 3. More content (SEO)

**New landing pages.** Add at least **8** pages to `src/content/seo-pages.ts`. Each needs:
- the same structure as the existing pages;
- 600 to 900 words of genuinely useful copy;
- 4 to 6 FAQs;
- 3 related links;
- a tool call to action pointing into the app.

Suggested slugs:
- `solana-meme-coin-name-ideas`
- `meme-coin-logo-ideas`
- `meme-mascot-generator`
- `meme-coin-website-template`
- `meme-coin-lore-generator`
- `funny-coin-name-ideas`
- `cat-meme-coin-ideas`
- `dog-meme-coin-ideas`
- `meme-coin-launch-checklist` (non-financial: branding, socials, safety)
- `fun-domain-vs-com`

Copy rules:
- Write for people, not keywords.
- Keep titles under 60 characters and descriptions between 140 and 160.
- No financial advice, and the rules in section 0 apply.

**Discover detail pages.** Add a statically generated detail page per idea, `/discover/[slug]`, with:
- its coin art, lore and a website preview (`<MemeSite embedded />`);
- a "Remix" call to action;
- its own Open Graph image, generated with `ImageResponse` from that coin.

These pages are long-tail SEO pages, so add them to the sitemap.

**Optional blog.** Add `/blog` with MDX posts only if there's time. If you do, start with 3 real guides, for example "How to name a meme brand" and "Designing a mascot that reads at 32px".

## 4. Premium coin art (replace the flat look)

The current coin images (`public/coins/*.webp`) are flat cartoon stickers inside a plain gold rim. Regenerate **all** of them, plus the new ones, with one consistent premium art direction. Also update the in-app `logo` image prompt in `src/lib/ai/image-prompts.ts`, so that coins users generate match the library.

**Art direction**

- **Rendering:**
  - a dimensional, collectible coin rendered in 3D;
  - a thick beveled rim with fine reeding (ridges) on the edge;
  - a slight three-quarter tilt, about 15 degrees, so the edge thickness shows.
- **Coin face:** the mascot is **embossed in relief**, so it reads as sculpted metal and enamel, not a flat sticker. Colored enamel fills sit inside metal outlines.
- **Materials:**
  - a polished metal rim (gold, silver, rose gold or gunmetal, matched to the palette);
  - glossy enamel;
  - one accent material per coin, such as holographic foil, glow-in-the-dark lime or iridescent pearl.
- **Lighting:** studio key light with soft rim light; specular highlights on the rim, a subtle reflection on the face and a soft contact shadow.
- **Details:**
  - a ring of tiny engraved dots or stars;
  - a thin inner ring;
  - subtle micro-scratches for realism;
  - a few small sparkles around the coin.
- **Background:** **transparent**, with the coin centered and some padding.
- **Never:** text, letters, numbers, ticker symbols, currency signs, real logos or real people.

**Prompt template** (fill the braces from the idea):

```
Premium collectible meme coin, 3D render, three-quarter view tilted about 15 degrees so the thick reeded edge is visible.
Coin face: {subject}, original cute cartoon character embossed in raised relief, colored glossy enamel fills inside crisp metal outlines, expressive face, personality: {traits}.
Rim: thick beveled {metal} rim with fine reeding, a ring of tiny engraved stars, thin inner ring. Accent: {accent material}.
Palette: {palette}. Studio lighting with a warm key light and a cool rim light, crisp specular highlights on the rim, soft reflection on the face, subtle micro-scratches, a few small sparkles around the coin.
Centered with padding, isolated on a fully transparent background, soft contact shadow only.
No text, no letters, no numbers, no symbols, no currency signs, no real logos, no real people.
```

**Generation script.** Write `scripts/generate-coins.mts` (run with `tsx`, read `.env.local`, never print the key):

- **Model:** use `gpt-image-1` with `background: "transparent"`, `quality: "high"`, `size: "1024x1024"`, `output_format: "png"`.
  - `gpt-image-2` cannot do transparent backgrounds, so use it only if it gains that.
  - Otherwise, generate on a flat chroma background and key it out, but compare quality first.
- **Output:** convert to WebP at 640px (quality about 85) with `sharp`, and keep the 1024px PNG masters out of `public/` (git-ignored).
- **Re-runs:** the script must be idempotent. Skip files that exist unless `--force` is passed, and accept `--only=slug1,slug2`.
- **Cost:** print the cost estimate before running and ask for confirmation. About 60 coins at high quality is a real cost.
- **Review:** generate 3 coins first, show them, and continue only after the owner approves the look.

**Check before you finish**

- The coins look like one consistent collection, with the same angle, lighting and rim style.
- They read clearly at 48px in the coin wall and at 400px in the hero.
- No text has crept into any image. Zoom in and check.

## 5. Milestones

1. **Audit:** run the Taste Skill audit, then screenshot the current home page at 390px, 768px and 1440px.
2. **Coin art:**
   - Build the generation script.
   - Generate 3 sample coins and get them approved.
   - Regenerate the library.
   - Update the `logo` prompt in `src/lib/ai/image-prompts.ts`.
3. **Discover:** expand to 48 or more ideas and add the `/discover/[slug]` pages with their own Open Graph images.
4. **Landing:**
   - Build the new sections in order, keeping the hero and coin wall fast on mobile.
   - Add the FAQ and its JSON-LD, the guides and the token teaser.
5. **SEO pages:** add 8 or more new pages, then update the sitemap and internal links.
6. **Quality checks:**
   - `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.
   - Load every marketing page in a headless browser at 390px and 1440px, with zero console errors.
   - Lighthouse meets the budget in section 1.
   - Every page has exactly one `h1`.
   - Pasting each URL into a social preview debugger shows the image.
7. **Ship:**
   - Commit on a branch and open a PR.
   - After it merges, deploy with `npx vercel deploy --prod`.
