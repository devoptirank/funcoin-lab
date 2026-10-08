import Link from "next/link"
import { ArrowUpRight, ShieldAlert } from "lucide-react"
import { pageMetadata } from "@/lib/seo"
import { TOKEN, getSocials } from "@/lib/official"
import { CoinImage } from "@/components/shared/coin-image"
import { ContractAddress } from "@/components/shared/contract-address"
import { SocialLinks } from "@/components/shared/social-icons"
import { TokenWaitlist } from "@/components/home/token-waitlist"

export const metadata = pageMetadata({
  title: `$${TOKEN.ticker}: Official ${TOKEN.name} Token Details`,
  description: TOKEN.live
    ? `The official ${TOKEN.name} token ($${TOKEN.ticker}) contract address, trading links and community channels. Always check the contract address here before you trade.`
    : `${TOKEN.name} plans to launch its own token ($${TOKEN.ticker}) on Solana. Join the wallet waitlist and find the official channels before launch.`,
  path: "/token",
})

const SAFETY = [
  "This page is the only official source of the contract address. Compare every character before you trade.",
  "We never DM you first, and admins never ask for your seed phrase, private key or a test payment.",
  "There are no presales, giveaways or airdrops that require you to send tokens.",
  "Links on this page go to independent third-party sites. Check you're on the real domain before connecting a wallet.",
]

export default async function TokenPage() {
  const socials = await getSocials()
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div>
          <p className="font-mono text-lg text-lab">${TOKEN.ticker}</p>
          <h1 className="mt-2 font-heading text-[clamp(2.4rem,5.5vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">
            {TOKEN.live ? `The official ${TOKEN.name} token` : `The ${TOKEN.name} token is coming`}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {TOKEN.live
              ? "A community meme token from the team behind FunCoin Lab, launched on Solana. Below are the only official contract address and links."
              : "We plan to launch our own meme token on Solana, built with this platform. Join the waitlist with your wallet and follow the official channels so you see the real contract address first."}
          </p>
        </div>
        <CoinImage src="/coins/funcoinlab.webp" alt={`${TOKEN.name} coin`} size={480} priority className="mx-auto w-full max-w-[18rem] lg:max-w-[22rem]" />
      </header>

      <section aria-labelledby="ca-title" className="mt-14 rounded-[2rem] border border-border bg-card p-6 sm:p-8">
        <h2 id="ca-title" className="font-heading text-2xl font-extrabold">Contract address</h2>
        {TOKEN.live ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Solana mint address. Copy it from here, never from a DM or a reply.</p>
            <ContractAddress ca={TOKEN.ca} className="mt-4" />
            {TOKEN.links.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {TOKEN.links.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-lab-fill/60">
                      {l.label} <ArrowUpRight className="size-4 opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="mt-3 flex flex-col items-start gap-4">
            <p className="text-muted-foreground">Not launched yet. There is no contract address, so any address you see shared today is not ours.</p>
            <TokenWaitlist />
          </div>
        )}
      </section>

      {socials.length > 0 && (
        <section aria-labelledby="social-title" className="mt-10">
          <h2 id="social-title" className="font-heading text-2xl font-extrabold">Official channels</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {socials.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer me" className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 hover:border-lab-fill/60">
                  <span className="font-semibold">{s.label}</span>
                  <span className="truncate text-sm text-muted-foreground">{s.url.replace(/^https:\/\/(www\.)?/, "")}</span>
                </a>
              </li>
            ))}
          </ul>
          <SocialLinks socials={socials} size="lg" className="mt-6 sm:hidden" />
        </section>
      )}

      <section aria-labelledby="safety-title" className="mt-10 rounded-[2rem] border border-border p-6 sm:p-8">
        <h2 id="safety-title" className="flex items-center gap-2 font-heading text-2xl font-extrabold">
          <ShieldAlert className="size-6 text-lab" aria-hidden /> Stay safe
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          {SAFETY.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Meme tokens are highly speculative and can lose all of their value. Nothing on this site is financial advice, an offer or a promise of any return. Read the{" "}
        <Link href="/disclaimer" className="underline underline-offset-4">disclaimer</Link>.
      </p>
    </div>
  )
}
