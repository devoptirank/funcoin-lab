import { legalDocs, type LegalDoc } from "@/content/legal"
import { pageMetadata } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

const fillEmail = (s: string) => s.replaceAll("{{CONTACT_EMAIL}}", siteConfig.contactEmail)

export function legalMetadata(slug: LegalDoc["slug"]) {
  const doc = legalDocs[slug]
  return pageMetadata({ title: doc.title, description: doc.description, path: `/${slug}` })
}

export function LegalDocument({ slug }: { slug: LegalDoc["slug"] }) {
  const doc = legalDocs[slug]
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm text-muted-foreground">Last updated {new Date(doc.updated).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold sm:text-5xl">{doc.title}</h1>
      <p className="glass mt-6 rounded-2xl p-5 text-base">{fillEmail(doc.summary)}</p>
      <div className="mt-10 space-y-10">
        {doc.sections.map((s, i) => (
          <section key={s.heading} aria-labelledby={`s-${i}`}>
            <h2 id={`s-${i}`} className="font-heading text-2xl font-bold">
              {s.heading}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-foreground/85">
              {s.paragraphs.map((p, j) => (
                <p key={j}>{fillEmail(p)}</p>
              ))}
              {s.bullets && (
                <ul className="list-disc space-y-1.5 pl-6">
                  {s.bullets.map((b, j) => (
                    <li key={j}>{fillEmail(b)}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
