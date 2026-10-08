/** Collapsible, read-only JSON viewer for raw provider payloads. */
export function JsonView({ value, label = "View JSON" }: { value: unknown; label?: string }) {
  let text: string
  try {
    text = JSON.stringify(value, null, 2) ?? "null"
  } catch {
    text = String(value)
  }
  return (
    <details className="group max-w-full">
      <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground">{label}</summary>
      <pre className="mt-2 max-h-96 max-w-[min(80vw,48rem)] overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed whitespace-pre">{text}</pre>
    </details>
  )
}
