# FunCoin Lab — Upgrade Prompt (v2: premium look, AI images, domains, paid plans)

> Paste everything below this line into your coding agent (Claude Code recommended), run from the `funcoin-lab/` folder.

---

You are upgrading **FunCoin Lab**, an existing, working Next.js app in this repository. It generates fictional meme-coin *brand concepts* and `.fun` website prototypes: names, lore, logos, memes, social copy and an editable landing page. Your job has five parts:

1. Give the site a distinctive, premium visual identity (Three.js, GSAP, Taste Skill, 21st.dev).
2. Generate real images (logos, mascot illustrations, memes, banners) with the OpenAI Images API.
3. Connect a real domain registrar for availability and pricing, with affiliate links.
4. Add premium features people pay for.
5. Take payments in crypto through NOWPayments.

Work in the milestones at the end, and keep the app building and working after each one.

## 0. Read first. Do not break these.

**The codebase as it is today**

- Next.js **16** (App Router, Turbopack), React 19, TypeScript, Tailwind CSS **v4** (tokens live in `src/app/globals.css` under `@theme`), Framer Motion, Lucide icons, Supabase.
- Next 16 differs from older versions. Middleware is `src/proxy.ts`, and `params`/`searchParams` are Promises. Read `node_modules/next/dist/docs/` before using any Next API you are unsure of.
- shadcn/ui here is built on **Base UI, not Radix**. Components use the `render` prop, not `asChild`. Link-buttons use `src/components/shared/button-link.tsx`. Any component you bring in from 21st.dev (which emits Radix-based code) must be adapted to Base UI or to plain markup. Do not add a second component system.
- Architecture to extend, not replace:
  - `src/lib/ai/`: provider abstraction (`types.ts`, `index.ts` registry, `providers/anthropic.ts`, `providers/openai.ts`, `tasks.ts` with AI→local fallback).
  - `src/lib/generator/`: offline template engine. It must keep working with no API keys.
  - `src/lib/domains/`: registrar abstraction (`none | rdap | http`).
  - `src/lib/store/repo.ts`: `Repo` interface, localStorage for guests and Supabase for signed-in users.
  - `src/lib/safety.ts`: sanitizes all generated text.
  - `src/components/site/meme-site.tsx` and `src/lib/site/export.ts`: generated website renderer and HTML export.
  - `supabase/migrations/0001_init.sql`: schema with RLS. Add new migrations; never edit old ones.

**Product principles (unchanged, and they apply to everything paid)**

- This is a creative branding and website-prototyping tool. Never add token creation, minting, trading, swaps, wallets or custody, prices, market caps, charts, holder counts, "launch your token" flows, or any claim that something will gain value.
- **What users pay for is creative tooling** (images, exports, hosting, more generations), never a token, a listing, or promotion of a real token.
- Do **not** sell paid placement in the Discover gallery. It would turn into promotion of real tokens.
- Keep the "Fictional concept" labels, the fixed disclaimer on every generated site, and the "Example concept only" token block.
- Accepting crypto **as payment** for software is fine. Copy must never imply that buying Pro relates to any token's value.

**Engineering rules**

- Secrets stay server-side. Only `NEXT_PUBLIC_*` values may reach the browser.
- Every paid action is authorized and debited **on the server**. Never trust the client.
- Every new feature degrades gracefully when its env vars are missing. Show a clear "not configured" state; never crash.
- Respect `prefers-reduced-motion`, keep WCAG AA contrast, keep it mobile-first, and allow no horizontal scroll at 360px.

## 1. Visual redesign: "The Lab", a unique, premium look

### Tooling

- **Taste Skill** (`github.com/Leonxlnx/taste-skill`). Install it and follow its `design-taste-frontend` rules for every UI change. Start with the dials at **variance 8, motion 6, density 4**. Read its anti-patterns list and remove any of them that currently appear on the site.
- **GSAP** with `@gsap/react` (`useGSAP`). GSAP and its plugins (ScrollTrigger, SplitText and others) are now free; verify the current licence on gsap.com. Use GSAP for scroll choreography and headline animation. Keep Framer Motion only for small component state transitions, and do not animate the same element with both.
- **Three.js** via `@react-three/fiber` + `@react-three/drei`. Pick the versions compatible with React 19 and load them only on the client (`next/dynamic` with `ssr: false`).
- **21st.dev**. Use the Magic MCP or the component registry for inspiration and starting points (pricing table, bento grid, marquee, magnetic button, animated tabs). Adapt every component to this repo's Base UI shadcn, its design tokens and its fonts. Never paste foreign color systems.

### Art direction

Push the existing dark, neon, glass identity further into a signature concept: a **mad-science meme lab**. The brand mark is already a flask 🧪. Make the whole site feel like experiments happening on a lab bench, not a generic crypto or AI SaaS template.

- **Hero (Three.js)**: a glass flask or bubbling beaker rendered with `MeshTransmissionMaterial`. Meme emoji "bubbles" (😴🐸🍌👽🤖) rise, wobble and pop. The scene tilts gently toward the cursor, and the liquid color shifts as the user types in the "What is your meme about?" input. When the user submits, the flask "boils over" and the transition hands off to `/create`. Cap DPR at 1.5, pause rendering off-screen (`frameloop="demand"` or an IntersectionObserver), and show a static image or CSS fallback on low-power devices and when reduced motion is on.
- **Scroll story (GSAP ScrollTrigger)**: a pinned section where one idea transforms step by step: *"sleepy cat" → name → logo → palette → lore → finished website*. Each step morphs in as the user scrolls. This is the clearest way to show what the product does.
- **Typography**: keep Bricolage Grotesque for display and use SplitText for character-level headline reveals. Add an expressive accent such as a variable-weight wobble on hover.
- **Microinteractions**: magnetic primary buttons, a cursor-follow glow on cards, a satisfying "pour" animation when a concept finishes generating, and confetti or bubbles on Save and Publish.
- **Texture**: subtle film grain or noise, liquid-gradient blobs and glass refraction. Avoid a flat "purple gradient SaaS" look.
- **Generator results**: present them as a lab report or specimen sheet, with the mascot in a specimen jar, the palette as test tubes, and lore as lab notes.
- **Website builder**: add 3–4 selectable **site templates** for generated sites (for example "Neon Arcade", "Y2K Chrome", "Sticker Bomb", "Minimal Luxe"). Templates change layout and motion, not just colors. Some are Pro (see section 4).
- Update the existing light mode as well. It should look intentional, not inverted.

**Performance budget**: mobile Lighthouse Performance ≥ 85, LCP < 2.5s, CLS < 0.05. Three.js and GSAP must not be in the initial JS of non-hero pages.

## 2. OpenAI image generation

- Extend `src/lib/ai/providers/openai.ts` (`generateImage`) and the image registry in `src/lib/ai/index.ts`. Use **`gpt-image-2`** by default, configurable through `IMAGE_MODEL`. Check OpenAI's current docs for model names, sizes, `background: "transparent"` support, quality options and pricing before coding.
- Asset types, each with its own prompt builder in `src/lib/ai/image-prompts.ts`:
  - `logo`: centered mascot mark, flat vector style, transparent background, no text.
  - `mascot`: full character illustration in several poses (happy, sleepy, angry, celebrating) to use across the site and memes.
  - `meme`: a meme image starring the mascot. Overlay captions in HTML/SVG; never ask the model to render text.
  - `banner`: X/Twitter header (1500×500), Telegram/Discord banners and an OG image.
  - `site-hero`: an illustration for the generated website's hero.
- Build every prompt from the concept's name, mascot, traits and palette. Always add style constraints and "no text, no logos of real brands, no real people".
- Run `omni-moderation-latest` (or the current OpenAI moderation model) on user-influenced prompt text before generating. Block real public figures, real brand names, and anything hateful or sexual.
- Store results in **Supabase Storage** (bucket `generated`, path `userId/projectId/type/uuid.png`). Save a row in a new `generated_assets` table and serve the public URL. Do not return big base64 blobs to the client.
- UI: "Generate with AI" buttons in Logo Studio, Meme Gallery and the builder's Mascot panel, plus a new "Brand Kit" tab. Show skeleton loading, allow retry, and keep a history of past generations per project. When images aren't configured or credits run out, fall back to the existing SVG badge and emoji meme cards.
- Every image generation costs credits (section 4), debited server-side **before** the API call and refunded automatically if the call fails.

## 3. Domain provider with referral earnings

- Default to **Dynadot**: it has a documented domain API and affiliate programs (CJ Affiliate and the Dynadot Ambassador Program). Read Dynadot's current API docs for the search/availability command, auth, IP allow-listing and rate limits. Keep the provider swappable, and add Namecheap or Porkbun later behind the same interface.
- Implement `DomainProvider` `dynadot` in `src/lib/domains/`. Return `available`/`registered` plus the price and currency when the API provides them. Never show "available" unless the registrar API says so. Cache results for 10 minutes, batch lookups, and keep the existing rate limiter.
- **Referral links**: add `buildRegistrarLink(domain)` driven by `DOMAIN_AFFILIATE_URL_TEMPLATE` (with a `{domain}` placeholder). Every "Buy" or "Registrar" button uses it. Add `rel="sponsored noopener"`, show a small "Affiliate link" note, and add an affiliate disclosure section to `/terms` or a new `/affiliate-disclosure` page.
- Log outbound registrar clicks in a `domain_clicks` table (domain, user id or anonymous id, timestamp) so you can measure conversion. Do not log personal data beyond this.
- UI: domain rows show status, price and a **"Get it on Dynadot"** button. Saved domains in the dashboard get the same button.

## 4. Premium features (what people pay for)

Plans live in one config file, `src/lib/billing/plans.ts`, so prices are easy to change. The prices below are suggested starting points:

| Plan | Price (USD, paid in crypto) | What it unlocks |
| --- | --- | --- |
| **Free** | $0 | Template generator, 3 AI concepts/day, SVG logo badge, HTML export with the "Made with FunCoin Lab" badge, 1 published site |
| **Pro Pass (30 days)** | $9 | 300 credits per pass, AI generation, Pro site templates, badge removal, 10 published sites, Brand Kit ZIP, priority generation |
| **Lifetime Lab** | $59 | Everything in Pro forever, plus 300 credits every 30 days while active (cap stockpiling) |
| **Credit packs** | $5 / 100, $12 / 300, $30 / 1000 | Top-ups for image generation |

Suggested credit costs: AI concept 1, logo image 5, mascot pose 5, meme image 4, banner set 8, site-hero art 5.

**Premium features to build:**

- **Brand Kit ZIP export**: logos (SVG + PNG at 3 sizes), mascot poses, palette (`.ase`/JSON/CSS variables), fonts list, social banners, bios as `.txt`, and a one-page PDF brand sheet.
- **Pro site templates** and **badge removal** on exported and published sites.
- **Custom domain for published sites** (later milestone, optional). Pro users point their own domain to their published page through the hosting provider's domains API. Ship it last, behind a feature flag.
- **Social banner pack**: correctly sized banners for X, Telegram and Discord, generated from the brand.
- **Unlimited saved projects** and project history (free is capped at 10).
- **Commercial-use note**: Pro users get explicit permission in the Terms to use their generated assets commercially, still subject to trademark checks. Make this a real Terms update, not just marketing copy.

**Gating:** add a `requireEntitlement(userId, feature)` / `spendCredits(userId, amount, reason)` service in `src/lib/billing/`. Call it from API routes, and design it so a race can never spend credits twice: use a Postgres function with row locking, or a single atomic `UPDATE … WHERE balance >= cost RETURNING`. Paid features require sign-in; guests see an upgrade prompt.

**UI:**

- A `/pricing` page with a 21st.dev-inspired pricing table and an FAQ that covers crypto payment, refunds and "no tokens are created or sold".
- An upgrade modal triggered by paywalled actions.
- A credits pill in the navbar.
- A "Billing" page in the dashboard showing plan, expiry, credit balance, credit history and payment history.

## 5. Payments with NOWPayments (crypto)

**Flow (hosted invoice, simplest and safest):**

1. A signed-in user clicks a plan or pack.
2. `POST /api/billing/checkout` (server) validates the product ID against `plans.ts` (never a client-sent price). It creates a `payments` row (`status: "pending"`, a unique `order_id`) and calls the NOWPayments **create invoice** endpoint with:
   - `x-api-key: NOWPAYMENTS_API_KEY`
   - `price_amount`, `price_currency: "usd"`, `order_id`, `order_description`
   - `ipn_callback_url = {SITE_URL}/api/billing/nowpayments/ipn`
   - `success_url` and `cancel_url`
3. Redirect the user to the returned `invoice_url`. They pay in any coin NOWPayments supports.
4. **IPN webhook** `POST /api/billing/nowpayments/ipn`:
   - Read the raw JSON. Recompute the signature as `HMAC-SHA512(JSON.stringify(body, Object.keys(body).sort()), NOWPAYMENTS_IPN_SECRET)` and compare it to the `x-nowpayments-sig` header with `crypto.timingSafeEqual`. Reject anything that doesn't match. **Confirm the exact sorting rules for nested objects in the current NOWPayments docs** and add a unit test with a known fixture.
   - Look up the payment by `order_id`. Check that the amount and currency match what you created. Store every IPN in `payment_events` (raw body and status) for auditing.
   - Fulfill **only once, idempotently**, when the status reaches `finished`. Treat `confirmed` as "processing". Handle `partially_paid` (show "underpaid, contact support" and don't fulfill), plus `failed`, `refunded` and `expired`.
   - Fulfillment runs in a single DB transaction: extend `pro_until`, set lifetime, or add credits, and write a `credit_ledger` entry.
5. The `/billing/success?order=…` page polls `GET /api/billing/status?order=…` until fulfilled, then celebrates. The webhook alone triggers fulfillment; the success page never does.

**Other requirements:**

- Support **NOWPayments sandbox** with a `NOWPAYMENTS_SANDBOX=true` switch (different base URL and keys). Check the current sandbox URL in their docs.
- Exclude `/api/billing/nowpayments/ipn` from rate limiting by IP, but limit it by valid signature. Make sure `src/proxy.ts` doesn't interfere with it.
- Recurring billing: use the **pass model** (each payment extends `pro_until` by 30 days) and send email reminders 3 days before expiry. NOWPayments also has a recurring/subscription API; leave a TODO and don't build it in this pass.
- Admin: a protected `/admin/payments` page (allow-list by email in `ADMIN_EMAILS`) to view payments and events and manually grant credits, with an audit log.

## 6. Database (new migration `0002_premium.sql`)

Add these tables with RLS (owners read their own rows; only the service role writes billing tables):

- `subscriptions` / `entitlements`: `user_id`, `plan`, `pro_until`, `lifetime`.
- `credit_balances` (one row per user) and an append-only `credit_ledger` (`delta`, `reason`, `ref`).
- `payments`: `order_id`, `product_id`, `amount_usd`, NOWPayments IDs, `status`, timestamps.
- `payment_events` (raw IPNs).
- `generated_assets`: `project_id`, `type`, `storage_path`, `prompt`, `model`, `cost`.
- `domain_clicks`.

Create a storage bucket `generated` with per-user path policies. The webhook and fulfillment code use `SUPABASE_SERVICE_ROLE_KEY` **server-only**, in a dedicated `src/lib/supabase/admin.ts` that imports `server-only`.

## 7. Environment variables to add to `.env.example`

```
OPENAI_API_KEY=            # images + moderation (can differ from AI_API_KEY)
IMAGE_PROVIDER=openai
IMAGE_MODEL=gpt-image-2

DOMAIN_PROVIDER=dynadot
DYNADOT_API_KEY=
DOMAIN_AFFILIATE_URL_TEMPLATE=   # your Dynadot affiliate link, with {domain}

NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_SANDBOX=true

SUPABASE_SERVICE_ROLE_KEY=       # server-only
ADMIN_EMAILS=
NEXT_PUBLIC_21ST_ENABLED=false   # not needed at runtime; dev tooling only
```

## 8. Legal and copy updates

- `/terms`: paid plans, credits (non-transferable, no cash value), crypto payments through NOWPayments, refunds (crypto payments are usually final; describe your policy), commercial-use rights for Pro, and the affiliate disclosure.
- `/privacy`: add NOWPayments (payment processing), OpenAI (image prompts) and Dynadot (domain lookups) as processors.
- `/disclaimer`: unchanged in spirit. Add one line: "Paying for FunCoin Lab buys software features only."
- Keep the note that the legal pages are templates and need lawyer review. Accepting crypto may also carry tax or KYC obligations depending on where the business is based; leave a TODO for the owner.

## 9. Milestones (ship each one green)

1. **Design system and hero**: Taste Skill setup, new tokens and typography, Three.js flask hero with fallbacks, GSAP scroll story on the homepage.
2. **Restyle every page** (generator lab report, tools, discover, dashboard, editor) and add the site templates.
3. **OpenAI images**: assets, storage, moderation, history, fallbacks.
4. **Dynadot domains** with affiliate links and click tracking.
5. **Billing core**: plans config, migration, credits service, pricing page, gating.
6. **NOWPayments**: checkout, signed IPN, idempotent fulfillment, success page, sandbox end-to-end test, admin page.
7. **Premium extras**: Brand Kit ZIP, banner pack, badge removal, legal updates. Custom domains last, behind a flag.

## 10. Definition of done (verify, don't assume)

- `npm run build` and `npm run lint` pass with zero errors. No hydration warnings in the browser console on any page.
- With **no** env vars set, the app still runs in guest/template mode. Paid and image features show "not configured" instead of errors.
- A Playwright script covers: hero renders (and the reduced-motion fallback renders), generate → save → builder → export, the upgrade modal appears on a paid action, and checkout creates an invoice in sandbox.
- Unit tests cover:
  - IPN signature verification (valid, tampered, missing header).
  - Fulfillment idempotency: the same IPN twice grants credits once.
  - The credit-spend race: two concurrent spends never overdraw.
  - The affiliate link builder.
- A manual sandbox payment moves from pending to finished and grants the right entitlement.
- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95 on `/` and `/pricing`.
- No secrets in client bundles: grep the `.next/static` output for key prefixes.
- Run a final grep showing no new financial language: "to the moon", "100x", "invest", "price prediction", "buy token".

When something is ambiguous (exact prices, the refund policy, which coins to accept), choose a sensible default, put it in config, and list it in a short "Decisions for the owner" note at the end of your work. Don't stop to ask.
