import { BackgroundFX } from "@/components/shared/background-fx"
import { ButtonLink } from "@/components/shared/button-link"
import { pageMetadata } from "@/lib/seo"
import { mascotUrl } from "@/lib/mascots"

export const metadata = pageMetadata({
  title: "About FunCoin Lab",
  description: "FunCoin Lab is a creative studio for meme branding: names, lore, logos, social content and .fun website concepts. Built for internet culture, not speculation.",
  path: "/about",
})

const VALUES = [
  { art: "wizard", title: "Creative first", text: "We help you invent characters, stories and websites. That's the whole job." },
  { art: "lab", title: "Honest by default", text: "No fake prices, charts or holder counts, ever. Every site carries a clear risk notice." },
  { art: "king", title: "No financial promises", text: "We don't create, list or sell tokens, and we never imply anything will gain value." },
  { art: "robot", title: "Open architecture", text: "Swap AI providers, connect a domain registrar and own your data in Supabase." },
]

export default function AboutPage() {
  return (
    <div className="relative isolate px-4 py-16 sm:px-6 sm:py-24">
      <BackgroundFX />
      <div className="mx-auto max-w-5xl">
        <h1 className="max-w-3xl font-heading text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.96] font-extrabold tracking-[-0.045em]">
          Built for <span className="text-lab">internet culture</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          FunCoin Lab started from a simple observation: the best part of meme culture is the creativity: the names, the mascots, the lore, the inside jokes. So we built a
          studio for exactly that. Type a ridiculous idea, get a complete brand and a website you can show your friends.
        </p>
      </div>
      <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="glass rounded-3xl p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- mascot artwork */}
            <img src={mascotUrl(v.art)} alt="" className="size-16 object-contain" />
            <h2 className="mt-3 font-heading text-xl font-bold">{v.title}</h2>
            <p className="mt-1 text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-5xl">
        <ButtonLink href="/create" variant="glow" size="xl">Create Your Idea →</ButtonLink>
      </div>
    </div>
  )
}
