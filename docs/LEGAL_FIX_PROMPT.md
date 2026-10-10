# FunCoin Lab — Legal Fix Prompt

> Paste everything below this line into your coding agent (Claude Code recommended), run from the `funcoin-lab/` folder.

---

You are fixing the **legal and compliance gaps** found in an audit of **FunCoin Lab**, an existing, working Next.js app in this repository. The audit found copy that is no longer true, tracking without consent, missing terms acceptance, thin handling of user-published content, and a token page that markets the team's own token without the disclosures it needs.

You are not a lawyer and neither was the audit. Your job is to make the site **accurate, consistent and ready for a lawyer's review**: fix what is plainly wrong, build the missing mechanisms, and leave every real legal decision as a clearly marked setting or question for the owner. Never write copy that says the site is "compliant", "legal", "regulated", "licensed" or "safe to invest in".

Work in the milestones at the end, and keep the app building and working after each one.

## 0. Read first. Do not break these.

- Next.js **16** (App Router), React 19, TypeScript, Tailwind v4, Supabase, Zod. Middleware is `src/proxy.ts`; `params`/`searchParams` are Promises. Read `node_modules/next/dist/docs/` before using a Next API you are unsure of. shadcn/ui here is built on **Base UI** (`render` prop, not `asChild`).
- Accounts are Solana wallets (`sol:<address>`), signed in through `src/lib/auth/siws.ts`. All data access is server-side with the service role. Use `withAccount`, `body()`, `rateLimit`, `getSetting` and `featureGate` as the rest of the code does.
- Legal copy lives in `src/content/legal.ts` and renders through `src/components/shared/legal-document.tsx`. SEO copy is in `src/content/seo-pages.ts`.
- Migrations: add a new file with the next free number in `supabase/migrations/` and append it to `supabase/setup-all.sql`. Never edit old ones. Balances change only through the `billing_*` SQL functions.
- Keep the existing safety filter, the fixed risk notice on generated sites, "no paid placement in Discover", and the env-only token contract address. Do not re-add "Fictional" labels.
- `docs/TOKEN_LAUNCH_PROMPT.md` describes a launchpad that is **not built**. Write copy for the site as it is today. Do not describe the launchpad as existing.

## 1. Owner details the site needs (do not invent these)

Add `src/lib/legal-config.ts`, reading these from env, all blank in `.env.example`:

`NEXT_PUBLIC_LEGAL_ENTITY` (the person or company that operates the site), `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_LEGAL_COUNTRY`, `NEXT_PUBLIC_GOVERNING_LAW`, `NEXT_PUBLIC_DISPUTE_VENUE`, `NEXT_PUBLIC_PRIVACY_EMAIL`, `NEXT_PUBLIC_COPYRIGHT_EMAIL`, `NEXT_PUBLIC_MIN_AGE` (default 18), `RESTRICTED_COUNTRIES` (comma-separated ISO codes, server-only, default empty).

Where a value is set, the legal pages show it. Where it is blank, the page leaves that sentence out; it never prints a placeholder or a made-up name. The admin System health page lists each one as set or missing. The "Who we are" and "Governing law" sections only appear once their values exist.

## 2. Make every statement true

The site says in many places that FunCoin Lab has nothing to do with tokens or prices. That stopped being true when `/token` was built: it presents the team's own token with a contract address, live price, market cap, chart, holder count and a "Buy on Pump.fun" button (`src/components/token/token-dashboard.tsx`), and `src/components/token/token-ticker.tsx` shows the price on every page once the token is live. Statements that contradict what the site does are a consumer-protection risk on their own.

Fix every one of these to say what is actually true: **the tools do not create, issue, list, trade or hold tokens for users; separately, the team has its own meme token, described on `/token`, and that page shows third-party market data.**

- `src/content/legal.ts`: Terms sections 2 and 8, the Disclaimer sections "We do not create or trade tokens" and "No claim of value", and both summaries.
- `src/app/(site)/about/page.tsx`: "We don't create, list or sell tokens" and "No fake prices, charts or holder counts, ever".
- `src/components/home/home-faq.tsx`: "We don't list, sell or trade tokens, show prices or tell anyone what to buy."
- `src/content/seo-pages.ts`: the FAQ answers near lines 87, 268, 780 and 1642, plus any other answer making the same claim. Search for it; do not rely on these line numbers.
- `src/components/layout/footer.tsx` and `src/components/home/launch-sections.tsx` ("None of them is a price chart").

Also remove stale lines: Terms section 8's "network Not selected, supply Customizable" placeholder sentence; Privacy section 9's "use a strong, unique password" (there are no passwords). Then read all three legal documents end to end against the code and fix anything else that no longer matches. Update the `UPDATED` date.

## 3. The team's own token (`/token`, the ticker, the waitlist)

Marketing a crypto asset to the public is regulated in many places (financial promotion rules in the UK, MiCA marketing rules in the EU, securities law in the US and elsewhere). The owner needs a lawyer for this; build the page so it is honest and so restrictions can be applied.

- **Disclosures block** on `/token`, fed by a `token` setting in `src/lib/settings.ts` (editable in admin, step-up required): share of supply held by the team and related wallets with their addresses, whether those tokens are locked, who launched it and where, and that the token gives no ownership, revenue share, utility or rights of any kind. Until the owner fills this in, the block says the information has not been published yet. Never leave it out silently.
- **Risk notice next to every way to buy or see the price**: beside the Buy button in the dashboard and in the ticker's link target, not only at the bottom of the page. The site-wide ticker gets a short "High risk. Not advice." label and must be dismissible.
- **Country restriction**: when the visitor's country (`x-vercel-ip-country`) is in `RESTRICTED_COUNTRIES`, `/token` hides the buy links, market data and waitlist and shows a plain notice, and the ticker is not rendered.
- **Waitlist copy**: remove "so you see the real contract address first" and anything else that suggests an advantage from being early. Joining requires ticking that the person is of legal age and has read the risk notice; store that with the waitlist entry.
- Add a conflict-of-interest line to the Disclaimer and to `/token`: the team holds the token and may benefit if people buy it.

## 4. Age, terms acceptance and restricted places

- **Minimum age 18** (from `NEXT_PUBLIC_MIN_AGE`). Replace the "13 years old" wording in Terms section 3 and Privacy section 12. A product that takes crypto payments and promotes a token should not invite minors.
- **Acceptance at first sign-in**: today nobody agrees to anything. Add a versioned terms acceptance: a tick box in the sign-in step ("I am 18 or older and accept the Terms and Privacy Policy", with links), the terms version included in the signed wallet message, and a `terms_acceptances` table (`account_id`, `terms_version`, `accepted_at`). When the version changes, ask again on next sign-in. The server refuses to issue a session without it.
- **Restricted places**: add a Terms section saying the service is not offered where it is unlawful or to people on sanctions lists, and that the user confirms they are not in one. Enforce `RESTRICTED_COUNTRIES` at sign-in and checkout with a clear message.
- **Operator, governing law, disputes**: new Terms sections fed by `legal-config.ts` (section 1).
- **Third parties**: name the real ones in Terms section 10 and Privacy section 7: Vercel, Supabase, the AI providers actually configured (Anthropic, OpenAI), NOWPayments, Google Analytics if kept, the domain registrar, the Solana RPC provider, WalletConnect/Reown.

## 5. Checkout (`src/components/billing/buy-credits-dialog.tsx`)

- Before paying, the buyer ticks one box: they accept the Terms, they ask for the credits to be delivered immediately, and they understand that crypto payments are final and that an immediate-delivery digital purchase may end any cooling-off right they would otherwise have. Record the tick and terms version on the `payment_orders` row. The server rejects orders without it.
- Show the pack, price in USD, what a credit buys and the no-refund rule in the same view as the Pay button.
- Terms section 9: add what happens to unused credits if the service closes or an account is banned, and that the buyer is responsible for any tax on their side. Leave the seller's own tax handling (VAT, GST, income from crypto receipts) to the owner; list it in your report as a question for an accountant.

## 6. Cookies, analytics and privacy

- **Google Analytics loads for every visitor with no consent**, and its ID is hard-coded as a fallback in `src/app/layout.tsx`. Remove the hard-coded ID (env only). Add a small consent banner: Accept, Decline, and a "Cookie settings" link in the footer to change the choice. GA loads only after Accept, using Consent Mode defaults of denied. Decline must be as easy as Accept. Remember the choice in a first-party cookie. No banner is needed if the owner removes GA; make that a single env switch.
- **Privacy Policy rewrite** (`src/content/legal.ts`), matching what the code really does: who the controller is (section 1), each kind of data with its purpose and legal basis, the named processors above, transfers outside the visitor's country, IP addresses used in memory for rate limiting, content reports and their reporter account, admin notes and moderation records on accounts, admin audit logs, the domain-click log (it stores no IP; keep `/affiliate-disclosure` in step with it), payment records kept for accounting, and a plain statement that wallet addresses and transactions on a public blockchain cannot be deleted by anyone.
- **Data rights that work**: the policy promises export and deletion by email, and the Contact page only offers Telegram. Add to `/dashboard/settings`:
  - **Download my data**: a JSON file of the account's projects, saved domains, activity, generated asset list, orders and ledger.
  - **Delete my account**: wallet signature to confirm; unpublish and delete projects, delete generated files from storage, remove saved domains, bookmarks and activity. Keep payment orders and the credit ledger (needed for accounting and disputes) and say so in the confirm dialog and the policy. Do it in one `security definer` SQL function plus storage cleanup, and make it safe to retry.
- **Contact page** (`src/app/(site)/contact/page.tsx`): show the contact email as well as Telegram, plus the privacy and copyright addresses when set. Legal requests need a channel that leaves a record.

## 7. User-published sites and generated content

FunCoin Lab hosts pages that users publish at `/site/[slug]`. These can carry a contract address, a "Buy $TICKER" button and "How to buy" steps, and some are featured in Discover as "chosen by the FunCoin Lab team".

- **Not-our-content notice** on every published site, beside the existing "Made with FunCoin Lab" line and in the HTML export (`src/lib/site/export.ts`): "This site was made by a FunCoin Lab user. FunCoin Lab has not reviewed or endorsed it or any token it mentions." It is fixed, not editable.
- **Discover**: community picks get the same notice in the section intro. A site with a contract address set cannot be featured; enforce this in the feature action and unfeature automatically if an address is added later.
- **Terms**: add a user-content section (the publisher owns and is responsible for it, grants us a licence to host and display it, we may remove it), and a **copyright and trademark complaints** section: what a notice must contain, where to send it (`NEXT_PUBLIC_COPYRIGHT_EMAIL`), counter-notice, and removal of repeat infringers' accounts.
- **Complaint route**: split the Report dialog's "Impersonation or copyright" into two reasons. The copyright and trademark option asks for the rights holder's name, the original work or mark, a contact email and a good-faith statement, stored on the `content_reports` row and shown in the admin queue.
- **Real people and brands**: `checkTopic` blocks about a dozen words, so a user can still build a brand, a site and a public page around a celebrity or a famous brand, and the offline generator will use the name as typed. Add a second blocklist category for real people, companies, characters and existing well-known tokens, seeded with a sensible starter list and extendable in admin Safety like the current terms. Apply both lists to the topic and to site text **when a project is saved and when it is published** (`src/lib/data/server.ts` only rewrites financial phrases today). Show a friendly message naming the reason.
- **Name banks**: remove "Doge" and "Wojak" from `src/lib/generator/banks.ts`, and check the rest of the file for other existing token names, brand names and well-known meme characters.
- **Example brands** (`src/lib/discover.ts`): each shows a `.fun` domain such as `chad.fun` that someone else may own. Label them as example names and make sure none is rendered as a link.

## 8. Quality bar

- Typecheck, `npm run lint` and `npm run build` pass after each milestone.
- Tests for: session refused without terms acceptance; re-acceptance on version change; order refused without the checkout tick; restricted country refused at sign-in, checkout and `/token`; GA script absent before consent and after Decline; account deletion removes content and keeps the ledger; a blocked name rejected on save and on publish; featured flag refused when a contract address is set.
- Every new notice is readable in light and dark mode, keyboard-accessible, and does not cover content on a phone.
- Keep the comment at the top of `src/content/legal.ts` saying these are templates that need a lawyer's review. Update the README with the new env vars and a short "before you go live" list of the owner decisions below.

## Milestones

1. **True statements**: section 2, plus `legal-config.ts` and its env vars.
2. **Consent and privacy**: analytics consent, Privacy Policy rewrite, contact email.
3. **Acceptance**: age 18, terms acceptance at sign-in, restricted countries, checkout tick, Terms additions.
4. **Token page**: disclosures block, risk notices, country restriction, waitlist changes.
5. **User content**: notices, Discover rule, complaint route, people-and-brands blocklist, name banks.
6. **Data rights**: download my data, delete my account.

After each milestone, give me: what changed, any new env vars or migrations I need to run in Supabase, how to test it, and an updated list of **decisions only the owner or a lawyer can make**. That list starts with: the operating entity and address; governing law and dispute venue; the restricted-country list; whether the token can be marketed at all in each target country and what disclosures it needs; team token holdings; tax on credit sales and on crypto received; whether to keep Google Analytics; and a lawyer's review of the Terms, Privacy Policy and Disclaimer.
