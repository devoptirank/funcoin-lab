# FunCoin Lab 🧪

**Turn ridiculous ideas into unforgettable meme brands.**

FunCoin Lab is an AI-powered meme-coin *idea* and `.fun` *website concept* generator. It creates names, ticker concepts, `.fun` domain ideas, lore, logo concepts, palettes, memes, social bios and posts, plus an editable, exportable landing page.

> FunCoin Lab is a creative branding and prototyping tool. It does **not** create, list, sell or trade tokens, hold wallets, show prices or give financial advice. Every concept is labeled as fictional.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; the app works with no keys
npm run dev                  # http://localhost:3000
```

With no environment variables set, the app runs fully in **guest mode**:
- Generation uses the built-in template engine (`src/lib/generator`), which is deterministic per seed and needs no network.
- Projects, saved domains and bookmarks are stored in the browser (`localStorage`).

## Configuration

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `anthropic`, `openai` or `local`. Defaults to `anthropic` when `AI_API_KEY` is set. |
| `AI_API_KEY` | Server-only key for the AI provider. Never sent to the browser. |
| `AI_MODEL` | Optional model override (Anthropic default: `claude-opus-5-5`). |
| `IMAGE_PROVIDER`, `IMAGE_API_KEY` | Optional AI logo images (`openai`). Without these, logos are generated SVG badges. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Enables accounts, cloud sync and website publishing. |
| `DOMAIN_PROVIDER` | `none` (default), `rdap` or `http`. See "Domain checks" below. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap and Open Graph. |

See `.env.example` for the full list.

## Architecture

```
src/
  app/
    (site)/            marketing + tools: home, create, domains, logo, memes, social, content,
                       discover, about, login, legal, and 9 SEO landing pages ([seoSlug])
    dashboard/         overview, ideas, brands, websites, domains, tools, settings
    editor/[id]        visual website editor
    preview/[id]       private full-screen preview
    site/[slug]        public published sites (Supabase)
    api/               generate/{concept,domains,content,social,memes,logo}, domains/check, status
  lib/
    ai/                provider abstraction (types, registry, prompts, schemas, tasks)
      providers/       anthropic.ts, openai.ts — add new providers here
    generator/         local template engine (concept, domains, social, memes, site)
    domains/           registrar abstraction (none | rdap | http)
    store/             Repo interface: localStorage (guest) and Supabase (signed in)
    supabase/          browser/server clients
    safety.ts          output guardrails (strips financial-promise language)
  content/             SEO page copy and legal templates
supabase/migrations/   database schema with row-level security
```

### AI providers
Each provider implements `AIProvider.generateObject({ system, prompt, schema })` in `src/lib/ai/types.ts`, which returns data validated against a Zod schema. To add a provider, create a file in `lib/ai/providers/` and register it in `lib/ai/index.ts`.

Every task in `lib/ai/tasks.ts` follows the same pattern: try the configured provider, fall back to the local generator on any error, then run `sanitizeDeep()` on the output. If the AI key is missing or a request fails, users still get a result.

### AI images
`POST /api/generate/image` creates logos, mascot poses, memes, banners and hero art with OpenAI's `gpt-image-2`. Before spending anything, each request goes through:
- a burst limit plus per-visitor and site-wide daily caps (`IMAGE_DAILY_LIMIT`, `IMAGE_GLOBAL_DAILY_LIMIT`);
- the topic blocklist and OpenAI moderation on any text the user can influence;
- `sanitizeText()` on the final prompt.

Prompts are built in `src/lib/ai/image-prompts.ts` and never ask for text in the image; meme captions are overlaid in HTML. Storage:
- **Guests:** images live in the browser's IndexedDB, and sites reference them as `asset:<id>`. HTML export inlines them as data URLs.
- **Signed in:** images are uploaded to the public Supabase bucket `generated` and recorded in `generated_assets` (migration `0002`).

`gpt-image-2` can't produce transparent backgrounds, so logos are generated on a solid brand-colored background.

### Wallet sign-in, credits and payments
- **Sign in with Solana.** The server issues a signed nonce (`/api/auth/nonce`), the wallet signs a readable message, and `/api/auth/verify` checks the ed25519 signature. Each nonce works only once. The session is an HttpOnly JWT cookie signed with `SESSION_SECRET`, and the account id is `sol:<address>`.
- **Credits.** Packs and per-image costs live in `src/lib/billing/plans.ts`. `POST /api/generate/image` charges credits before calling OpenAI and refunds automatically if generation fails.
- **Ledger.** `src/lib/billing/store.ts` is append-only and idempotent by `ref`. It uses Supabase (migration `0004`, with row-locked SQL functions) when `SUPABASE_SERVICE_ROLE_KEY` is set, and otherwise `.data/billing.json`, which suits a single server only.
- **Paying from a wallet in SOL or USDC.**
  - Each order gets a unique reference key and a quote locked for 15 minutes.
  - The browser sends a transfer that includes the reference.
  - `/api/billing/orders/:id/confirm` finds the transaction on-chain and checks that it paid `MERCHANT_SOLANA_ADDRESS` the full amount in the right token, and that the transaction hasn't paid for another order.
- **Paying through NOWPayments.**
  - `/api/billing/nowpayments/invoice` creates a hosted invoice.
  - `/api/billing/nowpayments/ipn` checks the `x-nowpayments-sig` signature (HMAC-SHA512) and grants credits only for a `finished` payment whose amount matches the order.
  - In your NOWPayments dashboard, set the IPN URL to `https://<your-domain>/api/billing/nowpayments/ipn`. It must be reachable from the internet, so localhost won't work.

### Domain checks
FunCoin Lab never claims a domain is available unless a real API says so.
- `none` returns "Unknown" and points users to a registrar search.
- `rdap` queries the public registry. It reports "Registered" or "No record found", but never "available", because premium or reserved names can have no record.
- `dynadot` uses Dynadot's `api3.json` search command (`DYNADOT_API_KEY`). It reports "Available" with the first-year price, or "Registered", and caches results for 10 minutes.
- `http` POSTs `{domains}` to your `DOMAIN_API_URL` and expects `{results:[{domain, available}]}`.

Only `dynadot` and `http` can show "Available".

**Affiliate links.**
- Every buy button points to `/go/domain?d=<domain>&src=<where>`.
- That route logs the click to `domain_clicks` (migration `0003`), or to the server log without Supabase, then redirects.
- The redirect target is built only from `DOMAIN_AFFILIATE_URL_TEMPLATE` (or the plain registrar search URL), so the route can't be used as an open redirect.
- Links use `rel="sponsored nofollow"`, and `/affiliate-disclosure` explains the arrangement.

### Database
Run `supabase/migrations/0001_init.sql` in your Supabase project. It creates `users`, `projects`, `meme_ideas`, `brand_profiles`, `domain_ideas`, `website_projects`, `meme_generations`, `social_generations` and `saved_projects`. Every table has owner-only RLS, and published `website_projects` rows are publicly readable. Then enable Email (magic link) auth and add `<site>/auth/callback` to the redirect URLs.

## Product guardrails
- No prices, market caps, volume, holder counts, charts, buy/sell buttons or wallets anywhere.
- The prompts forbid financial language, and `lib/safety.ts` rewrites anything that slips through (for example "to the moon", "100x", "guaranteed", "invest").
- Every generated site carries a non-removable disclaimer, and the token block is always labeled "Example concept only".
- `src/content/legal.ts` contains **templates**. Have a lawyer review them before launch.

## Scripts
`npm run dev` · `npm run build` · `npm start` · `npm run lint`
