/**
 * Legal copy and owner details. Run with: npm run test:legal
 * Each case loads the modules fresh (query string) so it can set its own env first.
 */
import test from "node:test"
import assert from "node:assert/strict"

const LEGAL_ENV = [
  "NEXT_PUBLIC_LEGAL_ENTITY", "NEXT_PUBLIC_LEGAL_ADDRESS", "NEXT_PUBLIC_LEGAL_COUNTRY", "NEXT_PUBLIC_GOVERNING_LAW", "NEXT_PUBLIC_DISPUTE_VENUE",
  "NEXT_PUBLIC_PRIVACY_EMAIL", "NEXT_PUBLIC_COPYRIGHT_EMAIL", "NEXT_PUBLIC_MIN_AGE", "RESTRICTED_COUNTRIES",
]
let n = 0
/** Fresh config for the given env, and the documents built from it. */
async function load(env: Record<string, string>) {
  for (const k of LEGAL_ENV) delete process.env[k]
  Object.assign(process.env, env)
  const config = (await import(`../src/lib/legal-config.ts?case=${++n}`)) as typeof import("../src/lib/legal-config")
  const { buildLegalDocs } = await import("../src/content/legal")
  return { config, legalDocs: buildLegalDocs(config.LEGAL) }
}
const text = (doc: { summary: string; sections: { heading: string; paragraphs: string[]; bullets?: string[] }[] }) =>
  [doc.summary, ...doc.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])].join("\n")

test("blank owner details: sections are left out, nothing is invented", async () => {
  const { config, legalDocs } = await load({})
  assert.equal(config.LEGAL.entity, "")
  assert.equal(config.LEGAL.minAge, 18)
  assert.deepEqual(config.restrictedCountries(), [])
  const headings = legalDocs.terms.sections.map((s) => s.heading)
  assert.ok(!headings.some((h) => /Who operates|Governing law/.test(h)))
  for (const doc of Object.values(legalDocs)) assert.doesNotMatch(text(doc), /undefined|null|\[.*(name|entity|address).*\]|TBD|your company/i)
})

test("set owner details appear in the Terms", async () => {
  const { legalDocs } = await load({ NEXT_PUBLIC_LEGAL_ENTITY: "Example Labs Ltd", NEXT_PUBLIC_LEGAL_COUNTRY: "Exampleland", NEXT_PUBLIC_GOVERNING_LAW: "Exampleland", NEXT_PUBLIC_DISPUTE_VENUE: "the courts of Exampleland" })
  const t = text(legalDocs.terms)
  assert.match(t, /operated by Example Labs Ltd, Exampleland\./)
  assert.match(t, /governed by the laws of Exampleland\. Disputes are to be brought before the courts of Exampleland\./)
})

test("Terms and Privacy sections are numbered 1..n with no gaps", async () => {
  for (const env of [{} as Record<string, string>, { NEXT_PUBLIC_LEGAL_ENTITY: "Example Labs Ltd", NEXT_PUBLIC_GOVERNING_LAW: "Exampleland" }]) {
    const { legalDocs } = await load(env)
    for (const doc of [legalDocs.terms, legalDocs.privacy]) doc.sections.forEach((s, i) => assert.ok(s.heading.startsWith(`${i + 1}. `), s.heading))
  }
})

test("statements about tokens are true: tools vs the team's own token", async () => {
  const { legalDocs } = await load({})
  for (const doc of [legalDocs.terms, legalDocs.disclaimer]) {
    const t = text(doc)
    assert.match(t, /team has, or plans to launch, its own meme token/)
    assert.match(t, /third part/i)
    // The old blanket claims and stale placeholders are gone.
    assert.doesNotMatch(t, /FunCoin Lab does not create, issue, deploy, list, sell or trade tokens/)
    assert.doesNotMatch(t, /Not selected|Customizable/)
  }
  assert.doesNotMatch(text(legalDocs.privacy), /password or secure sign-in/)
  for (const doc of Object.values(legalDocs)) assert.doesNotMatch(text(doc), /\b(compliant|licensed|safe to invest)\b/i)
})

test("minimum age and restricted countries parse safely", async () => {
  assert.equal((await load({ NEXT_PUBLIC_MIN_AGE: "21" })).config.LEGAL.minAge, 21)
  assert.equal((await load({ NEXT_PUBLIC_MIN_AGE: "five" })).config.LEGAL.minAge, 18)
  assert.equal((await load({ NEXT_PUBLIC_MIN_AGE: "3" })).config.LEGAL.minAge, 18)
  const { config } = await load({ RESTRICTED_COUNTRIES: " us, GB ,xx1,," })
  assert.deepEqual(config.restrictedCountries(), ["US", "GB"])
  assert.equal(config.isRestrictedCountry("gb"), true)
  assert.equal(config.isRestrictedCountry("FR"), false)
  assert.equal(config.isRestrictedCountry(null), false)
  assert.equal((await load({ NEXT_PUBLIC_PRIVACY_EMAIL: "not-an-email" })).config.LEGAL.privacyEmail, "")
})
