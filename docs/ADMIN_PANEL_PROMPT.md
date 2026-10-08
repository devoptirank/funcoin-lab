# FunCoin Lab — Admin Panel Prompt

> Paste everything below this line into your coding agent (Claude Code recommended), run from the `funcoin-lab/` folder.

---

You are adding an **admin panel** to **FunCoin Lab**, an existing, working Next.js app in this repository. The owner wants to operate the whole platform from one place: see how the business is doing, look up any wallet, fix billing problems, moderate published sites and AI images, change pricing and feature switches without a redeploy, and check that every integration is healthy.

Work in the milestones at the end, and keep the app building and working after each one.

## 0. Read first. Do not break these.

**The codebase as it is today**

- Next.js **16** (App Router, Turbopack), React 19, TypeScript, Tailwind CSS **v4** (tokens in `src/app/globals.css`), Supabase, Zod, Sonner toasts, Lucide icons.
- Next 16 differs from older versions. Middleware is `src/proxy.ts`, and `params`/`searchParams` are Promises. Read `node_modules/next/dist/docs/` before using any Next API you are unsure of.
- shadcn/ui here is built on **Base UI, not Radix**. Components use the `render` prop, not `asChild`. Reuse `src/components/ui/*` and `src/components/dashboard/page-header.tsx`. Do not add a second component system or a heavy admin framework (no react-admin, Refine, AdminJS).
- **Accounts are wallet-only.** Sign-in With Solana (`src/lib/auth/siws.ts`, `/api/auth/nonce`, `/api/auth/verify`) issues a 30-day HS256 JWT in the `fcl_session` cookie (`src/lib/auth/session.ts`). The account id is `sol:<base58 address>`. There is no email and no Supabase Auth.
- **All data access is server-side** through the service-role client in `src/lib/supabase/admin.ts`. RLS is enabled with no client policies. Keep it that way: the admin panel never gets a browser Supabase client.
- **Two hosts, one deployment** (`src/lib/hosts.ts`): marketing at `funcoinlab.com`, app at `app.funcoinlab.com`. `APP_PATHS` decides which host serves a path. `src/proxy.ts` routes between them. Localhost and `*.vercel.app` previews serve everything.
- **Schema** (`supabase/migrations/0004_billing.sql`, `0005_wallet_accounts.sql`):
  - `billing_accounts` (one row per wallet), `credit_ledger` (append-only, `ref` unique for idempotency), `payment_orders` (`sol | usdc | nowpayments`, status `pending | paid | expired | failed | partial`), `payment_events` (raw provider webhooks), `auth_nonces`.
  - SQL functions `billing_ensure_account`, `billing_balance`, `billing_spend`, `billing_credit`, `billing_fulfill_order`. These are the **only** way balances change. Use them; never `update` a balance or insert ledger rows by hand.
  - `projects` (concept + site JSON, `slug`, `published`), `saved_domains`, `activity` (`idea | meme | bios | content`), `bookmarks` (the token waitlist is the `waitlist-token` ref), `generated_assets` (files in the public `generated` storage bucket), `domain_clicks`.
  - Add new migrations starting at `0006_`. Never edit old ones. Also append them to `supabase/setup-all.sql`.
- **Existing helpers to reuse**: `withAccount` and `body()` in `src/lib/data/route.ts`, `requireSession` and `billingUnavailable` in `src/lib/billing/server.ts`, `rateLimit`/`clientKey` in `src/lib/rate-limit.ts`, `aiStatus()` in `src/lib/ai`, `getDomainProvider()` in `src/lib/domains`, pricing in `src/lib/billing/plans.ts`, official links and token info in `src/lib/official.ts`, safety filter in `src/lib/safety.ts`.
- **Dev fallback**: without Supabase, billing uses the file ledger in `.data/billing.json`. On Vercel, credits stay off until Supabase is connected (the `billingAvailable` guard). The admin panel must handle "Supabase not connected" with a clear read-only notice, not a crash.

**Product principles (unchanged)**

- This is a creative branding and website tool. The admin panel must not add token creation, minting, trading, swaps, custody, price data or "launch your token" flows. If a feature request drifts there, stop and flag it.
- Keep "not financial advice" and risk notices. The safety filter keeps blocking price, "100x" and "to the moon" promises. Do not re-add the old "Fictional" labels; they were removed on purpose.
- **No paid placement in Discover.** Admins can feature or hide community sites for quality and safety, never for money.

## 1. Security model (build this first)

An admin panel is the most valuable target on the site. Treat every rule here as required.

### Who is an admin

- `ADMIN_WALLETS` env var: a comma-separated list of Solana addresses. These are **owners** and cannot be removed from the UI. This is the bootstrap and the break-glass path.
- An `admin_users` table for everyone else, with a role:
  - `owner`: everything, including managing other admins and settings.
  - `admin`: users, billing adjustments, moderation, settings, but not admin management.
  - `support`: read everything, grant up to a capped number of credits per action (configurable, default 100), unpublish sites.
  - `viewer`: read-only.
- Define permissions as a single map in `src/lib/admin/permissions.ts` (for example `credits.adjust`, `orders.reverify`, `sites.unpublish`, `settings.write`, `admins.manage`) and check them with one helper. Never compare role strings inline.

### Step-up admin session

The normal 30-day wallet session is **not** enough to enter the admin panel.

- `/admin` asks the wallet to sign a separate message: `FunCoin Lab admin sign-in`, with domain, nonce, issued-at and expiry. Reuse the SIWS nonce flow but use a distinct statement so a normal sign-in signature can never be replayed as an admin one.
- On success, set a second cookie, `fcl_admin`: HttpOnly, `Secure`, `SameSite=Strict`, **host-only** (no shared parent domain), `path=/`, 8-hour max age. It is a JWT signed with `ADMIN_SESSION_SECRET` (separate from `SESSION_SECRET`, 32+ chars), whose subject must match the wallet session's account.
- Re-check the role from the database (or `ADMIN_WALLETS`) on **every** admin request. Removing an admin takes effect immediately, not when their cookie expires.
- **Dangerous actions** (credit adjustments over the support cap, refunds, banning a wallet, changing pricing, managing admins, enabling maintenance mode) require a fresh wallet signature over a message that names the action and its parameters, for example `Grant 500 credits to sol:7xK… — reason: failed IPN — nonce …`. Verify it server-side before executing.

### Enforcement

- One server guard, `requireAdmin(permission)` in `src/lib/admin/guard.ts`, used by **every** admin page (in the server component, before any data is fetched) and **every** admin route handler or server action. Return a plain 404 to non-admins so the panel's existence isn't revealed.
- Do not rely on `src/proxy.ts` or a layout for authorization. A layout check alone is bypassable through route handlers and server actions. The proxy may redirect for UX only.
- Mutations go through route handlers under `/api/admin/*` or server actions, each validated with Zod and rate-limited per admin (`rateLimit(clientKey(req, "admin:<account>"))`). Check `Origin` matches the app host on every non-GET request.
- `/admin` lives on the **app host**. Add it to `APP_PATHS`, set `robots: noindex, nofollow` metadata, add `/admin` to the `robots.ts` disallow list and keep it out of `sitemap.ts`.
- Never send secrets to the browser. The health page shows whether an env var is **set**, never its value.
- Optional, behind `ADMIN_IP_ALLOWLIST`: if set, the guard also rejects requests from IPs not on the list.

### Audit log

- `admin_audit` table: `id`, `admin_account`, `role`, `action`, `target_type`, `target_id`, `params jsonb`, `reason text not null`, `signature` (for step-up actions), `ip`, `user_agent`, `created_at`.
- Append-only: no update or delete path anywhere in the code, and revoke `update`/`delete` on the table in the migration.
- Every mutation writes exactly one audit row **in the same transaction** as the change. Put each mutation in a `security definer` SQL function that does both, like the existing `billing_*` functions.
- Every mutation form requires a **reason** field.

## 2. Schema changes (`0006_admin.sql`)

- `admin_users (account_id text primary key, role text check (...), added_by text, created_at, disabled_at)`.
- `admin_audit` as above.
- `billing_accounts`: add `status text not null default 'active' check (status in ('active','suspended','banned'))`, `status_reason text`, `status_changed_at timestamptz`, `last_seen_at timestamptz`, `notes text`.
- `projects`: add `moderation_status text not null default 'ok' check (... in ('ok','hidden','removed'))`, `moderation_reason text`, `featured boolean not null default false`.
- `generated_assets`: add `moderation_status` the same way.
- `site_settings (key text primary key, value jsonb not null, updated_by text, updated_at timestamptz)` for runtime settings (section 4).
- `content_reports (id, target_type, target_id, reason, reporter_account, status 'open'|'actioned'|'dismissed', created_at, resolved_by, resolved_at)` for user reports on published sites and images.
- Indexes for every admin list view's filter and sort (`payment_orders (status, created_at desc)`, `billing_accounts (created_at desc)`, `projects (published, updated_at desc)`, and so on).
- SQL functions, all `security definer`, all writing to `admin_audit`, all revoked from `public, anon, authenticated`:
  - `admin_adjust_credits(admin, account, delta, reason, ref)`: calls into the ledger with ref `admin:<uuid>`; never lets a balance go below zero.
  - `admin_set_account_status(admin, account, status, reason)`.
  - `admin_moderate_project(admin, project, status, reason)` and `admin_moderate_asset(...)`.
  - `admin_set_setting(admin, key, value, reason)`.
  - `admin_upsert_admin(admin, account, role, reason)` and `admin_disable_admin(...)` (owners only, and never disables an `ADMIN_WALLETS` owner).

**Enforcing account status across the app:** `withAccount`, `requireSession` and every `/api/generate/*` route must reject `suspended` and `banned` accounts with a clear message. Banned accounts' published sites are hidden. Cache the status lookup briefly (around 30 seconds) so it doesn't add a query to every request, and update `last_seen_at` at most once every few minutes per account.

## 3. Pages

Route group `src/app/(admin)/admin/...` with its own layout: a compact sidebar, a top bar showing the admin's short wallet address, role, environment (production, preview or local), Solana cluster, and a **Sign out of admin** button. Dense, calm, utilitarian. This is an operator tool, not a marketing page; skip GSAP, Three.js and decorative motion. Light and dark mode, keyboard-accessible, WCAG AA, usable on a phone for urgent tasks.

All list views: server-rendered, paginated with cursor or `limit/offset` through `searchParams`, filterable, sortable, with a search box, and **Export CSV** for the current filter (streamed, capped, audited). Mask wallet addresses as `7xK…3fQ` with a copy button and a Solscan link for the configured cluster.

1. **Overview** `/admin`
   - KPI tiles for today, 7 days and 30 days, each with the change from the previous period: new wallets, active wallets, projects created, sites published, AI images generated, credits sold, credits spent, revenue in USD (split by SOL, USDC and NOWPayments), domain affiliate clicks, waitlist signups.
   - Charts: daily revenue, daily signups, images by type. Use a small chart library or hand-rolled SVG, loaded only on this page.
   - Needs-attention list: orders stuck in `pending` past expiry, `partial` payments, failed IPNs, open content reports, image daily limit nearly reached, any integration down.
2. **Users** `/admin/users` and `/admin/users/[account]`
   - Search by full or partial wallet address. Filter by status, has-paid, created date.
   - Detail page tabs: Summary (balance, lifetime spend, first and last seen, status, internal notes), Credit ledger, Orders, Projects, Generated images, Activity, Saved domains, Audit history for this account.
   - Actions: grant or deduct credits (with reason; step-up over the support cap), suspend, ban, reinstate, edit internal notes, unpublish all their sites.
3. **Billing** `/admin/billing`
   - Orders table filtered by status, method, date and amount. Order detail shows the order, its linked ledger entry, every `payment_events` row for it and the on-chain transaction link.
   - **Re-verify** an SOL/USDC order: re-run the same on-chain check the confirm route uses (`src/lib/billing/solana.ts`) and, if valid, fulfil it through `billing_fulfill_order`. Never mark an order paid without a verified transaction or a verified NOWPayments status.
   - **Re-check** a NOWPayments order against their API.
   - **Refund**: crypto refunds are sent manually from the merchant wallet. The panel records the refund (amount, tx signature, reason), removes the unspent credits with a negative ledger entry, and audits it. It never holds keys or sends funds.
   - Webhook log: raw `payment_events`, filterable, JSON viewer.
   - Revenue report by day, week or month, exportable as CSV for accounting.
4. **Content** `/admin/content`
   - Published sites: list with thumbnail, slug, owner, published date, report count. Actions: open, hide, remove (with reason shown to the owner), feature or unfeature in Discover.
   - Generated images: a grid filterable by type, date and owner. Remove deletes the storage object from the `generated` bucket and marks the row `removed`.
   - Reports queue: open reports with context, plus actions (dismiss, hide, remove, suspend owner).
   - Add a small **Report** link to the footer of published sites (`/site/[slug]`) that creates a `content_reports` row (rate-limited, no sign-in needed).
   - The public Discover gallery and `/site/[slug]` must respect `moderation_status` and owner status.
5. **Safety** `/admin/safety`
   - View and extend the blocked-terms list used by `src/lib/safety.ts`. Code defaults stay as the floor; admin-added terms are stored in `site_settings` and merged on top. Admins can add terms, never remove the built-in ones.
   - A "test a phrase" box that shows what `sanitizeText` and `checkTopic` would do.
6. **Settings** `/admin/settings` (section 4).
7. **Domains & affiliates** `/admin/domains`: clicks by domain, source and day; active registrar provider; affiliate template set or not.
8. **Waitlist** `/admin/waitlist`: wallets on the token waitlist with join date, count over time, CSV export.
9. **Admins** `/admin/team` (owners only): list, add by wallet address and role, change role, disable. Requires step-up.
10. **System health** `/admin/system`
    - Status of Supabase, Solana RPC (latest slot and latency), NOWPayments (API reachable, sandbox or live), AI text and image providers (`aiStatus()`), domain provider, storage bucket.
    - Env checklist: each variable from `.env.example` shown as set, missing or invalid (for example `SESSION_SECRET` too short, `MERCHANT_SOLANA_ADDRESS` not valid base58). Never show values.
    - Build info: commit SHA, deploy time and environment from Vercel env vars.
11. **Audit log** `/admin/audit`: filter by admin, action, target and date. Read-only.

## 4. Runtime settings

Move the operational knobs into `site_settings`, read through one cached accessor `getSetting(key)` in `src/lib/settings.ts`. It uses `unstable_cache` or the Next 16 equivalent (check the docs) with a tag that is revalidated whenever an admin saves. Every setting has a Zod schema and a **code default**, so the site works exactly as today when the table is empty or Supabase is down.

- **Pricing**: credit packs (name, credits, USD, tagline, best-value flag), image costs per type, welcome credits. `src/lib/billing/plans.ts` becomes the default source; all server code reads through the settings accessor. Price changes apply to **new** orders only; existing pending orders keep their price.
- **Feature switches**: image generation, each AI tool, new sign-ins, checkout per payment method, publishing, domain search, waitlist. When off, the UI shows a friendly "temporarily unavailable" state and the API returns 503.
- **Limits**: global daily image limit (replaces reading `IMAGE_GLOBAL_DAILY_LIMIT` directly, with the env value as the default), per-wallet daily image limit, per-route rate limits.
- **Maintenance mode**: app host shows a maintenance page to everyone except admins; the marketing site stays up. Step-up required.
- **Announcement banner**: text, link, tone (info, warning) and start/end dates, shown on the site, the app or both. Run the text through the safety filter.
- **Social links**: editable here, with the `NEXT_PUBLIC_*` env values as defaults.
- **Token contract address stays env-only.** Show the current `NEXT_PUBLIC_TOKEN_CA` read-only in Settings with a note that changing it requires a redeploy. This is deliberate: a hijacked admin session must never be able to swap the address people buy. The same applies to `MERCHANT_SOLANA_ADDRESS`.

## 5. Quality bar

- Typecheck, `npm run lint` and `npm run build` pass after each milestone.
- Write tests for the guard and permissions (non-admin gets 404, viewer can't mutate, support cap enforced, removed admin is locked out immediately, normal-session signature can't be used for admin sign-in) and for each SQL mutation function (balance never negative, audit row always written, idempotent refs).
- No N+1 queries on list pages. Every list query is indexed and paginated.
- Every empty, loading and error state is designed. Destructive actions use a confirm dialog that repeats what will happen.
- Times shown in the admin's local timezone, stored in UTC.
- Update `.env.example` (blank values only: `ADMIN_WALLETS=`, `ADMIN_SESSION_SECRET=`, `ADMIN_IP_ALLOWLIST=`), `scripts/push-env-vercel.sh` and the README with how to become the first admin.

## Milestones

1. **Foundation**: migration `0006_admin.sql`, `ADMIN_WALLETS`, step-up admin sign-in, `requireAdmin`, permissions map, audit log, admin layout, empty Overview, noindex and robots. Prove a non-admin gets 404 everywhere.
2. **Users & credits**: user search and detail, credit adjustments, suspend/ban/reinstate, status enforcement across the app.
3. **Billing**: orders, re-verify and re-check, webhook log, refunds, revenue report.
4. **Content & safety**: sites and images moderation, reports queue and Report link, Discover featuring, safety terms.
5. **Settings**: runtime settings, pricing, feature switches, limits, maintenance mode, announcement banner.
6. **Operations**: Overview KPIs and charts, system health, waitlist, domains, admin team management, CSV exports.

After each milestone, give me: what changed, any new env vars or migrations I need to run in Supabase, and how to test it locally.
