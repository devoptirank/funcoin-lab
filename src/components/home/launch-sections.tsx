import Link from "next/link"
import { ArrowUpRight, AtSign, Globe, Image as ImageIcon, LayoutTemplate, ScrollText, ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react"
import { CREDIT_PACKS, IMAGE_COSTS } from "@/lib/billing/plans"
import { toAppUrl } from "@/lib/hosts"
import { ButtonLink } from "@/components/shared/button-link"
import { TokenWaitlist } from "./token-waitlist"
import { TOKEN } from "@/lib/official"
import { ContractAddress } from "@/components/shared/contract-address"
import { SocialLinks } from "@/components/shared/social-icons"

const CHECKLIST = [
  { icon: Sparkles, title: "A name people repeat", text: "Short, sayable, and searchable. Check trademarks before you go public.", href: "/create" },
  { icon: Globe, title: "A matching .fun domain", text: "Grab the name before someone else does. Confirm availability with a registrar.", href: "/domains" },
  { icon: ImageIcon, title: "An art kit", text: "Coin art, mascot poses, banners and memes that all look like one character.", href: "/logo" },
  { icon: AtSign, title: "Socials with one voice", text: "Bios for X, Telegram, Discord, Instagram and TikTok that sound alike.", href: "/social" },
  { icon: LayoutTemplate, title: "A real website", text: "Lore, links and a token section. Publish it or export the HTML.", href: "/dashboard/websites" },
  { icon: ScrollText, title: "Community rules", text: "Pin what's allowed, what isn't, and who the official admins are.", href: "/content" },
  { icon: ShieldCheck, title: "Contract-address safety", text: "Publish one official address in one place. Never share it first in DMs.", href: "/meme-coin-launch-checklist" },
]

/** A practical, non-financial launch checklist. Each item opens the tool that handles it. */
export function LaunchChecklist() {
  return (
    <section aria-labelledby="checklist-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="checklist-title" className="font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
            The launch checklist
          </h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">Seven things every meme brand needs before day one. None of them is a price chart.</p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {CHECKLIST.map((item, i) => (
            <li key={item.title} className={i === CHECKLIST.length - 1 ? "sm:col-span-2" : undefined}>
              <Link
                href={item.href.startsWith("/meme-") ? item.href : toAppUrl(item.href)}
                className="group flex h-full gap-4 rounded-3xl border border-border bg-card p-5 transition-colors hover:border-lab-fill/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-foreground/[0.06]">
                  <item.icon className="size-5 text-lab" aria-hidden />
                </span>
                <span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    {item.title}
                    <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-70" aria-hidden />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Free text tools, paid image credits. Packs come straight from billing/plans. */
export function PricingTeaser() {
  const cheapest = Math.min(...Object.values(IMAGE_COSTS))
  return (
    <section aria-labelledby="pricing-teaser-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-8 rounded-[2rem] border border-border bg-[color-mix(in_oklab,var(--violet)_14%,var(--card))] p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <h2 id="pricing-teaser-title" className="font-heading text-3xl font-extrabold sm:text-4xl">
            Free to create. Credits for AI art.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Names, lore, domains, memes, bios and websites cost nothing. AI images start at {cheapest} credits each. Pay with SOL, USDC or 100+ other coins.
          </p>
          <ButtonLink href="/pricing" variant="glass" size="lg" className="mt-6 px-4">
            <Zap /> See pricing
          </ButtonLink>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((p) => (
            <li key={p.id} className={`rounded-3xl border p-5 ${p.best ? "border-transparent bg-lab-fill text-lab-ink" : "border-border bg-background/60"}`}>
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-2 font-heading text-3xl font-black">{p.credits}</p>
              <p className={`text-sm ${p.best ? "text-lab-ink/75" : "text-muted-foreground"}`}>credits for ${p.usd}</p>
              <p className={`mt-3 text-xs ${p.best ? "text-lab-ink/75" : "text-muted-foreground"}`}>{p.tagline}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The FunCoin Lab token: a teaser only. No price, supply or value claims. */
export function TokenTeaser() {
  return (
    <section aria-labelledby="token-title" className="relative isolate overflow-hidden px-4 py-14 sm:px-6 sm:py-24">
      <div aria-hidden className="absolute top-1/2 left-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lab)] opacity-10 blur-[140px]" />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-foreground/[0.06]">
          <Wallet className="size-6 text-lab" aria-hidden />
        </span>
        <h2 id="token-title" className="font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
          {TOKEN.live ? `$${TOKEN.ticker} is live` : "The FunCoin Lab token is coming"}
        </h2>
        {TOKEN.live ? (
          <>
            <p className="max-w-xl text-lg text-muted-foreground">Our community meme token on Solana. This is the only official contract address.</p>
            <ContractAddress ca={TOKEN.ca} />
            <div className="flex flex-wrap justify-center gap-2">
              {TOKEN.links.slice(0, 3).map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
                  {l.label}
                </a>
              ))}
              <Link href="/token" className="rounded-full bg-lab-fill px-4 py-2 text-sm font-semibold text-lab-ink">
                Official details
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="max-w-xl text-lg text-muted-foreground">
              We plan to launch our own token on this platform. Join the waitlist with your wallet to hear first. There is no sale, price or allocation today.
            </p>
            <TokenWaitlist />
          </>
        )}
        <SocialLinks className="justify-center" />
        <p className="text-xs text-muted-foreground">
          Nothing here is financial advice or an offer. Read the{" "}
          <Link href="/disclaimer" className="underline underline-offset-4">
            disclaimer
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
