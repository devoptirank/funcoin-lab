// Small seeded PRNG so the local generator is reproducible (same seed → same concept).

export type Rng = {
  next: () => number
  int: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  pickMany: <T>(items: readonly T[], count: number) => T[]
  chance: (p: number) => boolean
}

export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)]
  const pickMany = <T,>(items: readonly T[], count: number): T[] => {
    const pool = [...items]
    const out: T[] = []
    while (out.length < count && pool.length) {
      out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
    }
    return out
  }
  return { next, int, pick, pickMany, chance: (p) => next() < p }
}

export function uid(prefix = "fc"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return `${prefix}_${rand}`
}
