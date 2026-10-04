import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { getSeoPage, seoPages } from "@/content/seo-pages"
import { BackgroundFX } from "@/components/shared/background-fx"
import { ButtonLink } from "@/components/shared/button-link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { pageMetadata } from "@/lib/seo"
import { absoluteUrl } from "@/lib/site-config"

export const dynamicParams = false

export function generateStaticParams() {
  return seoPages.map((p) => ({ seoSlug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[seoSlug]">) {
  const { seoSlug } = await params
  const page = getSeoPage(seoSlug)
  if (!page) return {}
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}` })
}

export default async function SeoLandingPage({ params }: PageProps<"/[seoSlug]">) {
  const { seoSlug } = await params
  const page = getSeoPage(seoSlug)
  if (!page) notFound()

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "FunCoin Lab", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: page.h1, item: absoluteUrl(`/${page.slug}`) },
      ],
    },
  ]
  const related = page.related.map((slug) => getSeoPage(slug)).filter((p) => p !== undefined)

  return (
    <article className="relative isolate">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="relative isolate overflow-hidden pt-14 pb-12 sm:pt-20">
        <BackgroundFX />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span>{page.eyebrow}</span>
          </nav>
          <h1 className="max-w-4xl font-heading text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.96] font-extrabold tracking-[-0.045em]">{page.h1}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{page.description}</p>
          <ButtonLink href={page.toolHref} variant="glow" size="xl" className="mt-8">
            {page.toolCta} <ArrowRight />
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="max-w-3xl space-y-5 text-lg leading-relaxed">
        {page.intro.map((p, i) => (
          <p key={i} className="text-pretty text-foreground/85">{p}</p>
        ))}
      </div></div>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="why">
        <h2 id="why" className="sr-only">Highlights</h2>
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
          {page.highlights.map((h, i) => (
            <div key={h.title} className={i === 0 ? "rounded-[2rem] bg-lab-fill p-7 text-lab-ink" : "rounded-[2rem] border border-border p-7"}>
              <h3 className="font-heading text-xl font-bold">{h.title}</h3>
              <p className={i === 0 ? "mt-2 opacity-80" : "mt-2 text-muted-foreground"}>{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="font-heading text-3xl font-extrabold">How it works</h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          <span aria-hidden className="absolute top-2 right-0 left-0 hidden h-px bg-border md:block" />
          {page.steps.map((s) => (
            <li key={s.title} className="relative pl-6 md:pt-8 md:pl-0">
              <span aria-hidden className="absolute top-1.5 left-0 size-3 rounded-full bg-lab-fill ring-4 ring-background md:top-0.5" />
              <h3 className="font-heading text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6" aria-labelledby="tips">
        <h2 id="tips" className="font-heading text-3xl font-extrabold">Tips that actually help</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {page.tips.map((t) => (
            <div key={t.title} className="rounded-3xl border border-border p-5">
              <dt className="font-semibold">{t.title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{t.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="font-heading text-3xl font-extrabold">Frequently asked questions</h2>
        <Accordion className="mt-6">
          {page.faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6" aria-labelledby="related">
        <h2 id="related" className="font-heading text-2xl font-extrabold">Keep exploring</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/${r.slug}`} className="glass card-hover flex h-full flex-col gap-1 rounded-2xl p-4">
                <span className="font-semibold">{r.h1}</span>
                <span className="text-sm text-muted-foreground">{r.eyebrow} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
