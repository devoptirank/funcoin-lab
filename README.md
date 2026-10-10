# FunCoin Lab

**Turn ridiculous ideas into unforgettable meme brands.**

FunCoin Lab is an AI-powered meme brand studio: it turns an idea into a meme coin brand and a `.fun` website. It creates names, ticker concepts, `.fun` domain ideas, lore, logo concepts, palettes, memes, social bios and posts, plus an editable, exportable landing page.

> FunCoin Lab is a branding and website tool. Wallets are used only to sign in and to pay for AI image credits. It does not list or trade tokens, hold user funds, show prices or give financial advice.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in Supabase and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

**Accounts are Solana wallets.** There is no email sign-up and no guest mode. A visitor connects a wallet, signs a free message, and everything they make (projects, websites, saved domains, images, credits) is stored on the server under their wallet address. Supabase is required for that storage.

Without an AI key, text generation uses the built-in template engine (`src/lib/generator`), which is deterministic per seed and needs no network.

### Two hosts
- `funcoinlab.com` (`NEXT_PUBLIC_SITE_URL`): the marketing site, SEO pages, pricing, legal and published sites (`/site/<slug>`).
- `app.funcoinlab.com` (`NEXT_PUBLIC_APP_URL`): the dashboard, tools and editor. Every page asks for a wallet first.

One deployment serves both. `src/proxy.ts` sends app paths requested on the marketing host to the app host, and the reverse. "Launch app" on the marketing site connects the wallet, signs in, then opens the app. The session cookie is set on the parent domain, so the sign-in carries over. On any other host (localhost, `*.vercel.app`) one host serves everything.

## Configuration

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `anthropic`, `openai` or `local`. Defaults to `anthropic` when `AI_API_KEY` is set. |
| `AI_API_KEY` | Server-only key for the AI provider. Never sent to the browser. |
| `AI_MODEL` | Optional model override (Anthropic default: `claude-opus-5-5`). |
| `IMAGE_PROVIDER`, `IMAGE_API_KEY` | Optional AI logo images (`openai`). Without these, logos are generated SVG badges. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Required. Stores everything per wallet; server-only. |
| `SESSION_SECRET` | 32+ random characters. Signs the wallet session cookie. |
| `NEXT_PUBLIC_APP_URL` | The app host (for example `https://app.funcoinlab.com`). |
| `DOMAIN_PROVIDER` | `none` (default), `rdap` or `http`. See "Domain checks" below. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap and Open Graph. |

See `.env.example` for the full list.

## Architecture

```
src/
  app/
    (site)/            marketing: home, discover, pricing, about, legal and 9 SEO pages ([seoSlug])
    (app)/             wallet-gated app: create, domains, logo, memes, social, content, dashboard/*
    editor/[id]        visual website editor (wallet-gated)
    preview/[id]       private full-screen preview (wallet-gated)
    site/[slug]        public published sites
    api/               auth, billing, generate/*, me/* (per-wallet data), domains/check, status
  lib/
    ai/                provider abstraction (types, registry, prompts, schemas, tasks)
      providers/       anthropic.ts, openai.ts — add new providers here
    generator/         local template engine (concept, domains, social, memes, site)
    domains/           registrar abstraction (none | rdap | dynadot | http)
    data/              server data layer, every query scoped to the wallet's account id
    store/             client Repo that calls /api/me/*
    hosts.ts           marketing/app host split
    supabase/          service-role client (server-only)
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

Prompts are built in `src/lib/ai/image-prompts.ts` and never ask for text in the image; meme captions are overlaid in HTML. The server uploads each image to the public Supabase bucket `generated` and records it in `generated_assets`. Sites reference the public URL, and HTML export inlines images as data URLs.

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

### Payment setup checklist
Run `npm run check:payments` at any time. It tests each item below against the live services and says what's missing.
1. **SOL and USDC (wallet payments):**
   - Set `MERCHANT_SOLANA_ADDRESS` to the wallet that should receive payments.
   - Send that wallet a little USDC once, so its USDC account exists.
   - Set a dedicated RPC, for example a Helius URL, in `SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_RPC_URL`.
2. **BTC, ETH, USDT and 100+ coins (NOWPayments):**
   - Create an account at nowpayments.io.
   - Add a payout wallet: where your money goes, in the coin you want to receive.
   - Enable the coins you accept (Settings > Coins).
   - Generate an API key and an IPN secret, and set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET`.
   - Set the IPN callback URL to `https://<your-domain>/api/billing/nowpayments/ipn`.
3. **Production:**
   - Set `NEXT_PUBLIC_SITE_URL` to your live https domain and `SESSION_SECRET` to 32+ random characters.
   - Connect Supabase (`SUPABASE_SERVICE_ROLE_KEY`, migration 0004) for a durable credit ledger.

For testing without real money, set `NEXT_PUBLIC_SOLANA_CLUSTER=devnet` and `NOWPAYMENTS_SANDBOX=true` with sandbox keys.

### Domain checks
FunCoin Lab never claims a domain is available unless a real API says so.
- `none` returns "Unknown" and points users to a registrar search.
- `rdap` queries the public registry. It reports "Registered" or "No record found", but never "available", because premium or reserved names can have no record.
- `dynadot` uses Dynadot's `api3.json` search command (`DYNADOT_API_KEY`). It reports "Available" with the first-year price, or "Registered", and caches results for 10 minutes.
  - Dynadot only answers API calls from IP addresses on your whitelist (Account > Tools > API). Vercel functions have no fixed IP, so on Vercel the lookup falls back to `rdap` unless you add a static outbound IP (Vercel Static IPs or a proxy) and whitelist it. Run `npm run check:domains` to test.
- `http` POSTs `{domains}` to your `DOMAIN_API_URL` and expects `{results:[{domain, available}]}`.

Only `dynadot` and `http` can show "Available".

**Affiliate links.**
- Every buy button points to `/go/domain?d=<domain>&src=<where>`.
- That route logs the click to `domain_clicks` (migration `0003`), or to the server log without Supabase, then redirects.
- The redirect target is built only from `NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE` (or the plain registrar search URL), so the route can't be used as an open redirect.
- Links use `rel="sponsored nofollow"`, and `/affiliate-disclosure` explains the arrangement.

### Database
Run the migrations in `supabase/migrations/` in order (or paste `supabase/setup-all.sql` into the SQL editor). After `0005_wallet_accounts.sql`, the tables are `billing_accounts`, `credit_ledger`, `payment_orders`, `payment_events`, `auth_nonces`, `projects`, `saved_domains`, `activity`, `bookmarks`, `generated_assets` and `domain_clicks`. RLS is on with no policies, so only the server (service role) can read or write. Supabase Auth is not used.

## Product guardrails
- The tools never create, issue, list, trade or hold tokens for users, and they never show invented prices, market caps, volume or holder counts. Wallets are only for sign-in and buying credits.
- A site a user publishes shows a contract address, a Buy button and market links only if its owner adds a contract address. Those point to third-party sites and are not verified.
- The team's own token is separate. When `NEXT_PUBLIC_TOKEN_CA` is set, `/token` and a site-wide ticker show its contract address, buy links and third-party market data (DexScreener, GeckoTerminal, Helius, Solana RPC). Blank means "coming soon" and none of that is shown.
- The prompts forbid financial language, and `lib/safety.ts` rewrites anything that slips through (for example "to the moon", "100x", "guaranteed", "invest").
- Every generated site carries a non-removable disclaimer, and the token block tells visitors to trust only the contract address published there.
- `src/content/legal.ts` contains **templates**. Have a lawyer review them before launch.

### Legal details and "before you go live"
The legal pages are templates (`src/content/legal.ts`) and the code is **not** legal advice. Owner details come from env (`src/lib/legal-config.ts`); a blank value leaves the matching sentence or section out, and Admin > System shows which are set.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_LEGAL_ENTITY`, `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_LEGAL_COUNTRY` | Who operates the site. Adds "Who operates the Service" to the Terms. |
| `NEXT_PUBLIC_GOVERNING_LAW`, `NEXT_PUBLIC_DISPUTE_VENUE` | Adds "Governing law and disputes" to the Terms. |
| `NEXT_PUBLIC_PRIVACY_EMAIL`, `NEXT_PUBLIC_COPYRIGHT_EMAIL` | Where privacy requests and copyright or trademark complaints go. |
| `NEXT_PUBLIC_MIN_AGE` | Minimum age, default 18. |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID. Blank = no analytics and no cookie banner. When set, the tag loads only after a visitor accepts. |
| `RESTRICTED_COUNTRIES` | Server-only, comma-separated two-letter codes where the service is not offered. |

Decisions only the owner or a lawyer can make, before going live:
1. The operating entity and its address.
2. Governing law and where disputes are heard.
3. The restricted-country list.
4. Whether the team's token can be marketed at all in each target country, and what disclosures it needs.
5. Team token holdings and whether they are locked (to publish on `/token`).
6. Tax on credit sales and on crypto received (ask an accountant).
7. Whether to keep Google Analytics.
8. A lawyer's review of the Terms, Privacy Policy and Disclaimer.

### Admin panel (admin.funcoinlab.com)
A hidden operator panel, served only on its own subdomain from the same deployment.
- **Become the first admin:** put your wallet address in `ADMIN_WALLETS` (comma-separated). Those wallets are owners. Set `ADMIN_URL=https://admin.funcoinlab.com` and a 32+ character `ADMIN_SESSION_SECRET`.
- **Database:** run `supabase/migrations/0006_admin.sql` in the Supabase SQL editor.
- **Domain:** in Vercel (project `funcoin-lab`) add `admin.funcoinlab.com`. At Hostinger DNS add a `CNAME` record named `admin` pointing to the target Vercel shows.
- **Signing in:** open admin.funcoinlab.com, connect your wallet, then sign the separate "admin sign-in" message. That sets an 8-hour, host-only cookie. Roles are re-checked on every request.
- **Isolation:** on funcoinlab.com and app.funcoinlab.com, `/admin` is an ordinary 404, never a redirect. Non-admin wallets also get a 404 on the admin host. On localhost and preview deployments the panel lives at `/admin`.
- Permissions live in `src/lib/admin/permissions.ts`, the guard in `src/lib/admin/guard.ts`. Every mutation is a SQL function that also writes the append-only `admin_audit` log.
- Tests: `npm run test:admin` (unit) and `npm run test:admin:e2e` (against a running server, see the script header).

### Hosting on Vercel
1. Add `funcoinlab.com`, `www.funcoinlab.com` and `app.funcoinlab.com` to the project, and point DNS at Vercel.
2. Run `bash scripts/push-env-vercel.sh`. It copies `.env.local` to Vercel, sets both URLs, creates a production `SESSION_SECRET` once, and deploys.

Vercel servers don't keep local files. Without `SUPABASE_SERVICE_ROLE_KEY`, a Vercel deployment turns off sign-in, credits and checkout (503), and NOWPayments retries its callbacks later.

## Scripts
`npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run check:payments`
