import { HERO_EXAMPLES } from "@/lib/discover"
import { FictionalBadge } from "@/components/shared/fictional-badge"

export function ExamplesMarquee() {
  const items = [...HERO_EXAMPLES, ...HERO_EXAMPLES]
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <ul className="animate-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
        {items.map((ex, i) => (
          <li key={i} aria-hidden={i >= HERO_EXAMPLES.length} className="glass card-hover flex w-72 shrink-0 items-center gap-3 rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated coin artwork */}
            <img src={ex.coin} alt="" width={56} height={56} className="size-14 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-extrabold">
                <span className="text-lab">${ex.ticker}</span>
                <span className="text-muted-foreground">.fun</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">{ex.line}</p>
              <FictionalBadge className="mt-1" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
