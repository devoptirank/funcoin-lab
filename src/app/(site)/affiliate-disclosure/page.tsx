import { pageMetadata } from "@/lib/seo"
import { registrarName } from "@/lib/domains/affiliate"
import { siteConfig } from "@/lib/site-config"

export const metadata = pageMetadata({
  title: "Affiliate Disclosure",
  description: "How FunCoin Lab earns from domain registrar links, and what that does and doesn't change for you.",
  path: "/affiliate-disclosure",
})

export default function AffiliateDisclosurePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-extrabold sm:text-5xl">Affiliate disclosure</h1>
      <p className="mt-6 rounded-2xl border border-border p-5 text-base">
        Some “Get it on {registrarName}” links are affiliate links. If you buy a domain through one, we may earn a commission. You pay the same price.
      </p>
      <div className="mt-10 space-y-8 leading-relaxed text-foreground/85">
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground">What this changes</h2>
          <p className="mt-3">
            Nothing about which names we suggest. Domain ideas come from your meme idea, not from what pays us. We never mark a domain as available unless the registrar
            says so, and prices are always confirmed by the registrar at checkout.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground">What we record</h2>
          <p className="mt-3">
            When you click a registrar link we log the domain, where on the site you clicked it, and your account id if you&apos;re signed in. We don&apos;t log your IP
            address. Purchases happen entirely on the registrar&apos;s site, under their terms and privacy policy.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground">Questions</h2>
          <p className="mt-3">
            Email us at <a className="underline underline-offset-4" href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
          </p>
        </section>
      </div>
    </article>
  )
}
