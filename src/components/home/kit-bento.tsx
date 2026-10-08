import Link from "next/link"
import { toAppUrl } from "@/lib/hosts"
import { ArrowUpRight } from "lucide-react"
import type { MemeConcept } from "@/lib/types"
import { MemeImage } from "@/components/shared/meme-card"
import { MascotLogo } from "@/components/shared/mascot-logo"
import { generateMemesLocal } from "@/lib/generator/memes"
import { generateDomainIdeas } from "@/lib/generator/domains"
import { cn } from "@/lib/utils"
import { TypingDomains, CyclingCaption, SpinningCoin } from "./live-demos"

function Cell({ href, title, text, className, children }: { href: string; title: string; text: string; className?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={toAppUrl(href)}
      className={cn(
        "group relative flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-border p-6 transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-7",
        className,
      )}
    >
      {children}
      <div>
        <h3 className="flex items-center gap-2 font-heading text-2xl font-bold">
          {title}
          <ArrowUpRight className="size-5 opacity-50 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
        </h3>
        <p className="mt-1 max-w-sm text-sm opacity-75">{text}</p>
      </div>
    </Link>
  )
}

/** Asymmetric "lab kit" bento: six real tools, each cell showing real generated output. */
export function KitBento({ concept, coin }: { concept: MemeConcept; coin: { src: string; fallback: string } }) {
  const [meme] = generateMemesLocal({ name: concept.name, mascot: concept.mascot, catchphrase: concept.catchphrase, traits: concept.traits }, 1, 7)
  const domains = generateDomainIdeas(concept.name, 5)

  return (
    <section aria-labelledby="kit-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
      <h2 id="kit-title" className="max-w-2xl font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
        One character, every asset.
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6">
        <Cell
          href="/create"
          title="Name, lore & personality"
          text="A name, ticker concept, origin story, slogan and catchphrase that all sound like the same character."
          className="bg-[var(--lab)] text-[var(--lab-ink)] md:col-span-4 md:row-span-2"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-heading text-[clamp(3rem,7vw,6rem)] leading-none font-black tracking-[-0.05em]">${concept.ticker}</p>
              <p className="mt-3 max-w-md font-heading text-2xl font-bold">“{concept.slogan}”</p>
            </div>
            <div className="hidden w-44 shrink-0 rotate-6 transition-transform duration-500 group-hover:rotate-0 sm:block lg:w-56">
              <MascotLogo name={concept.name} ticker={concept.ticker} mascot={concept.mascot} colors={concept.palette.map((c) => c.hex)} variant={2} />
            </div>
          </div>
        </Cell>
        <Cell href="/domains" title=".fun domains" text="Name ideas you can check with a real registrar." className="bg-card md:col-span-2">
          <TypingDomains domains={domains} />
        </Cell>
        <Cell href="/memes" title="Meme gallery" text="Meme cards starring your mascot." className="bg-card md:col-span-2">
          <div className="flex flex-col gap-3">
            <MemeImage meme={meme} name={concept.name} className="max-w-[11rem] rotate-[-3deg] rounded-xl shadow-lg transition-transform duration-300 group-hover:rotate-0" />
            <CyclingCaption captions={concept.memeIdeas.slice(0, 4)} />
          </div>
        </Cell>
        <Cell href="/logo" title="Logo & palette" text="Collectible coin art and a palette that fit the personality." className="bg-[color-mix(in_oklab,var(--violet)_18%,var(--card))] md:col-span-3">
          <div className="flex items-center gap-5">
            <SpinningCoin src={coin.src} fallback={coin.fallback} />
            <div className="flex h-14 flex-1 overflow-hidden rounded-2xl" aria-hidden>
              {concept.palette.map((c) => (
                <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
              ))}
            </div>
          </div>
        </Cell>
        <Cell href="/social" title="Social bios" text="X, Instagram, TikTok, Telegram and Discord, ready to paste." className="bg-card md:col-span-3">
          <p className="rounded-2xl bg-foreground/[0.05] p-4 text-sm leading-relaxed whitespace-pre-line">{concept.socialBio}</p>
        </Cell>
      </div>
    </section>
  )
}
