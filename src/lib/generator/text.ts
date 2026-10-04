export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}

/** Lowercase a-z0-9 only — suitable for a domain label. */
export function slugify(input: string, max = 40): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, max)
}

/** URL slug with hyphens, for routes. */
export function kebab(input: string, max = 48): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
}

/** Uppercase ticker concept, letters/digits only, 3–8 chars. */
export function tickerize(input: string, max = 8): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (clean.length <= max) return clean.padEnd(3, "X")
  // Prefer dropping vowels (after the first letter) before truncating.
  const squeezed = clean[0] + clean.slice(1).replace(/[AEIOU]/g, "")
  return (squeezed.length >= 3 ? squeezed : clean).slice(0, max)
}

export function toDomain(label: string): string {
  const slug = slugify(label, 48)
  return `${slug || "meme"}.fun`
}

export function fill(template: string, vars: Record<string, string>): string {
  return fixArticles(template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? ""))
}

/** "a ironic cat" → "an ironic cat", "a unhinged" → "an unhinged", but "a unicorn" stays. */
export function fixArticles(text: string): string {
  return text.replace(/\b([Aa]) (?=[aeioAEIO]|[uU]n(?![iI]))/g, "$1n ")
}

export function cap(input: string): string {
  return input ? input[0].toUpperCase() + input.slice(1) : input
}
