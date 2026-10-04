import { Check } from "lucide-react"
import { BackgroundFX } from "@/components/shared/background-fx"
import { SectionHeading } from "@/components/shared/section-heading"
import { BuyCreditsButton } from "@/components/billing/buy-button"
import { CREDIT_PACKS, IMAGE_COSTS, WELCOME_CREDITS } from "@/lib/billing/plans"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Pricing: Credits for AI Brand Images",
  description: "Name, lore, domains, memes and websites are free. Credits pay for AI images like logos, mascots and banners. Pay with your Solana wallet or 100+ cryptocurrencies.",
  path: "/pricing",
})

const COST_LABELS: Record<keyof typeof IMAGE_COSTS, string> = {
  logo: "AI logo",
  mascot: "Mascot pose",
  meme: "Meme image",
  banner: "X / Telegram banner",
  "site-hero": "Website hero art",
}

const FREE = ["Unlimited idea, name and lore generation", ".fun domain ideas and registrar checks", "Website builder, templates and HTML export", "Vector logo badge, memes and social copy"]

const FAQ = [
  { q: "How do I pay?", a: "Connect a Solana wallet (Phantom, Solflare, Backpack) and pay in USDC or SOL, or choose Other crypto to pay with BTC, ETH, USDT and 100+ more through NOWPayments." },
  { q: "Do credits expire?", a: "No. Credits stay on your wallet account until you use them. If an image fails to generate, its credits are refunded automatically." },
  { q: "Can I get a refund?", a: "Crypto payments are final once confirmed. Unused credits can't be withdrawn as cash. If something went wrong with a payment, contact us and we'll sort it out." },
  { q: "Is buying credits an investment?", a: "No. Credits are a prepaid balance for FunCoin Lab tools. They aren't a token, can't be traded and have no cash value." },
]

export default function PricingPage() {
  return (
    <div className="relative isolate px-4 py-14 sm:px-6 sm:py-20">
      <BackgroundFX className="opacity-60" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading as="h1" eyebrow="Pricing" title={<>Build free. Pay only for <span className="text-lab">AI art</span>.</>} description={`Every wallet gets ${WELCOME_CREDITS} free credits to start. Top up with crypto when you need more.`} />

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-border p-7">
            <p className="text-sm font-semibold text-muted-foreground">Always free</p>
            <p className="mt-2 font-heading text-4xl font-black">$0</p>
            <ul className="mt-6 space-y-3 text-sm">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-lab" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </div>
          {CREDIT_PACKS.map((p) => (
            <div key={p.id} className={p.best ? "flex flex-col rounded-[2rem] bg-lab-fill p-7 text-lab-ink" : "flex flex-col rounded-[2rem] border border-border p-7"}>
              <p className="text-sm font-semibold opacity-75">{p.name}</p>
              <p className="mt-2 font-heading text-4xl font-black">${p.usd}</p>
              <p className="mt-1 text-sm opacity-80">
                {p.credits} credits · {p.tagline}
              </p>
              <p className="mt-6 text-xs opacity-70">${(p.usd / p.credits).toFixed(3)} per credit</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <BuyCreditsButton />
        </div>

        <section aria-labelledby="costs" className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 id="costs" className="font-heading text-3xl font-extrabold">What credits buy</h2>
            <p className="mt-2 text-muted-foreground">AI images are generated with OpenAI from your brand&apos;s mascot, personality and palette.</p>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:grid-cols-2">
            {(Object.keys(IMAGE_COSTS) as (keyof typeof IMAGE_COSTS)[]).map((k) => (
              <div key={k} className="flex items-center justify-between bg-background p-5">
                <dt>{COST_LABELS[k]}</dt>
                <dd className="font-heading text-xl font-bold tabular-nums">{IMAGE_COSTS[k]} credits</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="faq" className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 id="faq" className="font-heading text-3xl font-extrabold">Questions</h2>
          <dl className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
