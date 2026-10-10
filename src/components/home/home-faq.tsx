import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CREDIT_PACKS, IMAGE_COSTS, WELCOME_CREDITS, type CreditPack } from "@/lib/billing/plans"

export type FaqPricing = {
  packs: CreditPack[]
  imageCosts: Record<string, number>
  welcomeCredits: number
}
export type Faq = { q: string; a: string }

/** The home FAQ, with prices taken from the current pricing settings. */
export function homeFaqs(pricing: FaqPricing): Faq[] {
  const minCost = Math.min(...Object.values(pricing.imageCosts))
  const starter = pricing.packs[0]
  return [
    {
      q: "Is FunCoin Lab free?",
      a: `Yes. Names, ticker concepts, lore, .fun domain ideas, memes, social bios, posts and the website builder are free within fair-use limits. AI images use credits: from ${minCost} credits per image${pricing.welcomeCredits > 0 ? `, and new wallets get ${pricing.welcomeCredits} free credits` : ""}.${starter ? ` Packs start at ${starter.credits} credits for $${starter.usd}.` : ""}`,
    },
    {
      q: "Do I need an account?",
      a: "No sign-up form and no email. Connect a Solana wallet such as Phantom, Solflare or Backpack and sign a free message. Your wallet is your account, so the same wallet brings your projects back on any device.",
    },
    {
      q: "Does signing in cost anything or move funds?",
      a: "No. Signing in is a message signature, not a transaction. It costs no gas and can't move anything out of your wallet. We never ask for your seed phrase or private key.",
    },
    {
      q: "Is any of this financial advice?",
      a: "No. FunCoin Lab is a branding and website tool. The tools don't create, list, sell, trade or hold tokens for you, and we don't tell anyone what to buy. Generated copy never promises gains, and every site carries a risk notice. Separately, the team has, or plans to launch, its own meme token. The Token page describes it and shows third-party market data once it is live, and that isn't advice either.",
    },
    {
      q: "Can I use the names and art for my project?",
      a: "Yes, subject to our Terms. AI output can resemble existing names or brands, so check trademarks and search for similar projects before you use a name or logo publicly.",
    },
    {
      q: "How do credits work?",
      a: "Credits pay for AI images such as coin art, mascot poses, memes and banners. You buy a pack once with SOL, USDC or 100+ other cryptocurrencies, and credits never expire. If an image fails, the credits come back automatically.",
    },
    {
      q: "Can I publish the website?",
      a: "Yes. Edit any section, choose one of five templates, then publish to a public link or export a standalone HTML file you can host anywhere.",
    },
    {
      q: "What is a .fun domain?",
      a: "A web address ending in .fun, like sleepycat.fun. It's short, playful and often still available for meme names. FunCoin Lab suggests names; a registrar confirms availability and price before you buy.",
    },
  ]
}

/** The FAQ with the code-default prices. */
export const HOME_FAQS = homeFaqs({
  packs: CREDIT_PACKS,
  imageCosts: { ...IMAGE_COSTS },
  welcomeCredits: WELCOME_CREDITS,
})

export function HomeFaq({ faqs = HOME_FAQS }: { faqs?: Faq[] }) {
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-24">
      <h2 id="faq-title" className="font-heading text-4xl font-extrabold sm:text-5xl">
        Questions, answered
      </h2>
      <Accordion className="mt-8">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
