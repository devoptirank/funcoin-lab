import Link from "next/link"
import { ButtonLink } from "@/components/shared/button-link"
import { Hero } from "@/components/home/hero"
import { ExamplesMarquee } from "@/components/home/examples-marquee"
import { IdeaStory } from "@/components/home/idea-story"
import { KitBento } from "@/components/home/kit-bento"
import { generateConceptLocal } from "@/lib/generator/concept"
import { conceptToSite } from "@/lib/generator/site"

const STORY_TOPIC = "sleepy cat"

export default function HomePage() {
  const concept = generateConceptLocal({ topic: STORY_TOPIC, theme: "animals", personality: "cute", namingStyle: "short", seed: 2026 })
  const site = conceptToSite(concept)

  return (
    <>
      <Hero />

      <section aria-label="Example concepts" className="border-y border-border py-6">
        <p className="sr-only">Freshly generated brand concepts</p>
        <ExamplesMarquee />
      </section>

      <IdeaStory concept={concept} site={site} topic={STORY_TOPIC} />

      <KitBento concept={concept} />

      {/* Principles: a plain statement, no card. */}
      <section aria-labelledby="principles-title" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-8 border-t border-border pt-12 lg:grid-cols-[1fr_1.2fr]">
          <h2 id="principles-title" className="font-heading text-4xl leading-[1.02] font-extrabold sm:text-5xl">
            Creative, not financial.
          </h2>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              FunCoin Lab makes names, lore, logos and website prototypes. We don&apos;t create, list or sell tokens, show prices or give investment advice.
            </p>
            <p>
              Generated copy never promises gains, and every site carries a risk notice.{" "}
              <Link href="/disclaimer" className="text-foreground underline underline-offset-4">
                Read the disclaimer
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA: editorial, left-aligned. */}
      <section className="relative isolate overflow-hidden px-4 py-28 sm:px-6">
        <div aria-hidden className="absolute bottom-[-40%] left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[var(--violet)] blur-[170px] [opacity:var(--glow-opacity)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <h2 className="max-w-4xl font-heading text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            Your next internet meme <span className="text-lab">starts here.</span>
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-lg text-muted-foreground">Create the name. Build the brand. Make the meme. Have some fun.</p>
            <ButtonLink href="/create" variant="glow" size="xl" className="px-7">
              Create Your Idea →
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
