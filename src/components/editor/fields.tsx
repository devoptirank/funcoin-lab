"use client"
import { useId } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function TextField({ label, value, onChange, multiline, maxLength = 200, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; maxLength?: number; placeholder?: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <Textarea id={id} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="min-h-28 text-sm" />
      ) : (
        <Input id={id} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <input id={id} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5" />
      <label htmlFor={id} className="flex-1 text-sm">
        {label}
      </label>
      <Input aria-label={`${label} hex`} value={value} maxLength={7} onChange={(e) => onChange(e.target.value)} className="h-8 w-24 font-mono text-xs uppercase" />
    </div>
  )
}

export function RangeField({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider aria-label={label} value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
    </div>
  )
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn("rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors", value === o.id ? "border-transparent bg-lab-fill font-semibold text-lab-ink" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PanelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-0">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}
