"use client"
import { useEffect, useState } from "react"
import { Wand2 } from "lucide-react"
import type { MemeConcept } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRepoData } from "@/components/providers/store-provider"
import { setCurrentConcept, useCurrentConcept } from "@/lib/store/current"
import { generateConceptLocal } from "@/lib/generator/concept"
import { checkTopic } from "@/lib/safety"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * Lets standalone tools work on any brand: the latest generated concept, a saved project,
 * or a quick instant concept from a typed idea.
 */
export function BrandPicker({ value, onChange }: { value: MemeConcept | null; onChange: (c: MemeConcept) => void }) {
  const current = useCurrentConcept()
  const { data: projects } = useRepoData((r) => r.listProjects(), [])
  const [idea, setIdea] = useState("")

  useEffect(() => {
    if (!value && current) onChange(current)
  }, [value, current, onChange])

  useEffect(() => {
    if (!value && !current && projects[0]) onChange(projects[0].concept)
  }, [value, current, projects, onChange])

  const options = [...(current ? [current] : []), ...projects.map((p) => p.concept).filter((c) => c.id !== current?.id)].slice(0, 8)

  const quick = () => {
    const topic = idea.trim()
    if (!topic) return
    const check = checkTopic(topic)
    if (!check.ok) return toast.error(check.reason)
    const c = generateConceptLocal({ topic, theme: "custom", personality: "random", namingStyle: "oneword" })
    setCurrentConcept(c)
    onChange(c)
    setIdea("")
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold sm:w-32">Working on</p>
        <div className="flex flex-wrap gap-2">
          {options.length === 0 && <span className="text-sm text-muted-foreground">No brands yet. Type an idea below.</span>}
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                value?.id === c.id ? "border-transparent bg-lab-fill font-semibold text-lab-ink" : "border-border hover:border-lab-fill/60",
              )}
            >
              <span aria-hidden>{c.mascot}</span> {c.name}
            </button>
          ))}
        </div>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          quick()
        }}
      >
        <label htmlFor="quick-idea" className="text-sm font-semibold sm:w-32">
          Or a new idea
        </label>
        <Input id="quick-idea" value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={60} placeholder="e.g. Angry Penguin" className="h-10 flex-1" />
        <Button type="submit" variant="glass" size="lg" disabled={!idea.trim()}>
          <Wand2 /> Use idea
        </Button>
      </form>
    </div>
  )
}
