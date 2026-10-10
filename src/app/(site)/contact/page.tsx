import { Handshake, Lightbulb, Mail, Rocket, ShieldCheck, Bug } from "lucide-react"
import { pageMetadata } from "@/lib/seo"
import { CoinImage } from "@/components/shared/coin-image"
import { BrandIcon } from "@/components/shared/social-icons"
import { siteConfig } from "@/lib/site-config"
import { LEGAL } from "@/lib/legal-config"

export const metadata = pageMetadata({
  title: "Contact FunCoin Lab",
  description: "Questions, launch help, partnerships or a bug to report? Message the FunCoin Lab founder on Telegram at @ravihere0, or write by email for anything that needs a record.",
  path: "/contact",
})

const TELEGRAM = "https://t.me/ravihere0"
const QUOTE = "Every legendary meme started as a ridiculous idea someone was brave enough to say out loud."
const TOPICS = [
  { icon: Rocket, title: "Launch help", text: "Branding, your website, or getting ready for launch day." },
  { icon: Handshake, title: "Partnerships", text: "Collabs, communities and creators who want to build together." },
  { icon: Lightbulb, title: "Feature ideas", text: "Something the lab should make? Tell me what you need." },
  { icon: Bug, title: "Bugs and payments", text: "Anything broken, or credits that didn't arrive." },
]
// Email leaves a record, which legal, privacy and copyright requests need. Extra addresses show only when set.
const EMAILS = [
  { label: "General and legal requests", address: siteConfig.contactEmail },
  { label: "Privacy requests", address: LEGAL.privacyEmail },
  { label: "Copyright and trademark complaints", address: LEGAL.copyrightEmail },
].filter((e, i, all) => e.address && all.findIndex((x) => x.address === e.address) === i)
const ORBIT = ["/coins/sleepy.webp", "/coins/banana.webp", "/coins/alien.webp", "/coins/moondog.webp", "/coins/frogking.webp", "/coins/capybro.webp"]

export default function ContactPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="contact-blob absolute -top-32 -left-24 size-[28rem] rounded-full bg-[radial-gradient(closest-side,var(--violet),transparent)] [opacity:var(--glow-opacity)]" />
        <div className="contact-blob contact-blob-2 absolute top-1/3 -right-32 size-[24rem] rounded-full bg-[radial-gradient(closest-side,var(--lab),transparent)] opacity-25" />
      </div>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            Let&apos;s talk <span className="text-lab">memes</span>
          </h1>
          <blockquote className="max-w-xl font-heading text-xl leading-snug font-bold sm:text-2xl" aria-label={QUOTE}>
            <span aria-hidden>
              {QUOTE.split(" ").map((word, i) => (
                <span key={i} className="contact-word inline-block" style={{ animationDelay: `${0.25 + i * 0.06}s` }}>
                  {word}&nbsp;
                </span>
              ))}
            </span>
          </blockquote>
          <p className="max-w-lg text-lg text-muted-foreground">
            No ticket queues and no bots. FunCoin Lab is built by one person who reads every message. Say hi on Telegram.
          </p>

          {/* Telegram card with a rotating gradient border */}
          <div className="contact-border max-w-md rounded-[2rem] p-[2px]">
            <div className="flex flex-col gap-5 rounded-[calc(2rem-2px)] bg-popover p-6">
              <div className="flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#229ED9] text-white">
                  <BrandIcon id="telegram" className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Telegram</p>
                  <p className="truncate font-mono text-xl font-bold">@ravihere0</p>
                </div>
              </div>
              <a
                href={TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-pulse relative inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[var(--lab)] px-6 text-base font-semibold text-[var(--lab-ink)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <BrandIcon id="telegram" className="size-5" /> Message on Telegram
              </a>
              <p className="text-xs text-muted-foreground">t.me/ravihere0 · usually replies within a day</p>
            </div>
          </div>
        </div>

        {/* Brand coin with coins in orbit */}
        <div aria-hidden className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center sm:max-w-[26rem]">
          <div className="absolute inset-[6%] rounded-full border border-dashed border-border" />
          <div className="absolute inset-[22%] rounded-full border border-border/60" />
          <div className="contact-orbit absolute inset-0">
            {ORBIT.map((src, i) => (
              <div key={src} className="absolute inset-0" style={{ transform: `rotate(${(360 / ORBIT.length) * i}deg)` }}>
                <div className="contact-counter absolute top-[2%] left-1/2 -ml-7 size-14 sm:-ml-8 sm:size-16">
                  <CoinImage src={src} alt="" size={128} className="size-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="contact-float relative size-[46%]">
            <CoinImage src="/coins/funcoinlab.webp" alt="" size={320} priority className="size-full" />
          </div>
        </div>
      </section>

      <section aria-labelledby="topics-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 id="topics-title" className="font-heading text-3xl font-extrabold sm:text-4xl">
          What to message about
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((t, i) => (
            <li key={t.title} className="contact-rise rounded-3xl border border-border bg-card p-5" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <t.icon className="size-6 text-lab" aria-hidden />
              <p className="mt-4 font-semibold">{t.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="email-title" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 id="email-title" className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <Mail className="size-5 text-lab" aria-hidden /> Prefer email?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            For anything that needs a written record, such as privacy requests, copyright or trademark complaints, payment problems or legal notices, please write by email.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EMAILS.map((e) => (
              <div key={e.address} className="min-w-0 rounded-2xl border border-border p-4">
                <dt className="text-xs font-semibold text-muted-foreground">{e.label}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${e.address}`} className="font-mono text-sm break-all underline underline-offset-4">
                    {e.address}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <ShieldCheck className="size-6 shrink-0 text-lab" aria-hidden />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Stay safe:</span> I&apos;ll never DM you first, ask for your seed phrase or private key, or ask you to send
            crypto. The only official Telegram is <span className="font-mono text-foreground">@ravihere0</span>.
          </p>
        </div>
      </section>
    </div>
  )
}
