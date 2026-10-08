/**
 * Generates the premium coin library with OpenAI images.
 *
 *   npx tsx scripts/generate-coins.mts --only=sleepy,banana --yes
 *   npx tsx scripts/generate-coins.mts --all --yes          (every coin missing a master)
 *   flags: --force (regenerate existing), --out=public|preview, --quality=high|medium
 *
 * Masters (1024px PNG, transparent) go to art/coins-master/ (git-ignored). Web copies (640px WebP)
 * go to public/coins/ by default, or art/coins-preview/ with --out=preview for review.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { COIN_ART, coinPrompt } from "../src/lib/coin-art"

const root = path.resolve(import.meta.dirname, "..")
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}
const KEY = process.env.OPENAI_API_KEY || process.env.IMAGE_API_KEY
if (!KEY) throw new Error("OPENAI_API_KEY is missing in .env.local")

const args = new Map(process.argv.slice(2).map((a) => (a.includes("=") ? (a.replace(/^--/, "").split("=") as [string, string]) : [a.replace(/^--/, ""), "true"])))
const only = args.get("only")?.split(",").map((s) => s.trim())
const force = args.has("force")
const quality = args.get("quality") ?? "high"
const outDir = path.join(root, args.get("out") === "preview" ? "art/coins-preview" : "public/coins")
const masterDir = path.join(root, "art/coins-master")
mkdirSync(outDir, { recursive: true })
mkdirSync(masterDir, { recursive: true })

const todo = COIN_ART.filter((c) => (only ? only.includes(c.slug) : args.has("all"))).filter(
  (c) => force || !existsSync(path.join(masterDir, `${c.slug}.png`)),
)
// gpt-image-1, 1024x1024: about $0.17 at high quality, $0.04 at medium (OpenAI pricing, 2026).
const each = quality === "high" ? 0.17 : 0.04
console.log(`${todo.length} coin(s) to generate at ${quality} quality, about $${(todo.length * each).toFixed(2)}.`)
if (!todo.length) process.exit(0)
if (!args.has("yes")) {
  console.log("Re-run with --yes to confirm.")
  process.exit(0)
}

async function generate(prompt: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", quality, background: "transparent", output_format: "png", n: 1 }),
    })
    const json = (await res.json()) as { data?: { b64_json: string }[]; error?: { message: string } }
    if (res.ok && json.data?.[0]?.b64_json) return Buffer.from(json.data[0].b64_json, "base64")
    if (attempt >= 3) throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    await new Promise((r) => setTimeout(r, 4000 * attempt))
  }
}

let done = 0
const queue = [...todo]
await Promise.all(
  Array.from({ length: 3 }, async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      try {
        const png = await generate(coinPrompt(c))
        writeFileSync(path.join(masterDir, `${c.slug}.png`), png)
        await sharp(png).resize(640, 640, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 85, alphaQuality: 90 }).toFile(path.join(outDir, `${c.slug}.webp`))
        console.log(`[${++done}/${todo.length}] ${c.slug}`)
      } catch (e) {
        console.error(`FAILED ${c.slug}: ${e instanceof Error ? e.message : e}`)
      }
    }
  }),
)
