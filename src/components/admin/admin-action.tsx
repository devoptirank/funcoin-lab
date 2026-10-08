"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type ActionField =
  | { name: string; label: string; type: "number"; min?: number; max?: number; placeholder?: string; defaultValue?: number }
  | { name: string; label: string; type: "text" | "textarea"; placeholder?: string; defaultValue?: string; maxLength?: number }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; defaultValue?: string }

type StepUp = { action: string; summary: string; params: Record<string, unknown> }

/**
 * A button that opens a confirm dialog for an admin mutation. Every action asks for a reason (sent
 * as `reason`). Extra fields are merged into the JSON body with `payload`. If the server answers
 * 428 stepup_required, the admin's wallet signs the exact action and the request is retried.
 */
export function AdminAction({
  label,
  endpoint,
  method = "POST",
  payload = {},
  fields = [],
  title,
  description,
  confirmLabel,
  destructive,
  requireReason = true,
  variant = "outline",
  size = "sm",
  className,
  onDone,
}: {
  label: React.ReactNode
  endpoint: string
  method?: "POST" | "PATCH" | "DELETE"
  payload?: Record<string, unknown>
  fields?: ActionField[]
  title: string
  /** What will happen, repeated in the dialog. */
  description: string
  confirmLabel?: string
  destructive?: boolean
  requireReason?: boolean
  variant?: "outline" | "glow" | "ghost" | "destructive" | "glass"
  size?: "sm" | "lg" | "xs"
  className?: string
  onDone?: (result: unknown) => void
}) {
  const router = useRouter()
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue === undefined ? "" : String(f.defaultValue)])),
  )
  const [reason, setReason] = useState("")

  const body = () => {
    const out: Record<string, unknown> = { ...payload }
    for (const f of fields) out[f.name] = f.type === "number" ? Number(values[f.name]) : values[f.name]
    if (requireReason) out.reason = reason.trim()
    return out
  }

  const send = async (extra?: Record<string, unknown>) =>
    fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body(), ...extra }) })

  const signStepUp = async (s: StepUp) => {
    if (!wallet.connected) {
      setVisible(true)
      throw new Error("Connect your admin wallet, then try again.")
    }
    if (!wallet.signMessage) throw new Error("This wallet can't sign messages.")
    const c = await fetch("/api/admin/stepup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
    const cj = (await c.json().catch(() => ({}))) as { message?: string; token?: string; error?: string }
    if (!c.ok || !cj.message || !cj.token) throw new Error(cj.error || "Couldn't start the confirmation")
    toast.info("Confirm this action in your wallet")
    const signature = bs58.encode(await wallet.signMessage(new TextEncoder().encode(cj.message)))
    return { signature, token: cj.token }
  }

  const submit = async () => {
    if (requireReason && reason.trim().length < 3) return toast.error("Add a reason (at least 3 characters).")
    setBusy(true)
    try {
      let res = await send()
      let json = (await res.json().catch(() => ({}))) as { error?: string; code?: string; stepUp?: StepUp }
      if (res.status === 428 && json.code === "stepup_required" && json.stepUp) {
        const proof = await signStepUp(json.stepUp)
        res = await send({ stepUp: proof })
        json = (await res.json().catch(() => ({}))) as typeof json
      }
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`)
      toast.success("Done")
      setOpen(false)
      setReason("")
      onDone?.(json)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed"
      toast.error(/reject|cancel|declin/i.test(msg) ? "Signature cancelled" : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <div className="flex flex-col gap-3">
            {fields.map((f) => (
              <label key={f.name} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">{f.label}</span>
                {f.type === "select" ? (
                  <select
                    className="h-9 rounded-lg border border-border bg-background px-2"
                    value={values[f.name]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="min-h-20 rounded-lg border border-border bg-background p-2"
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    value={values[f.name]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="h-9 rounded-lg border border-border bg-background px-2"
                    type={f.type}
                    placeholder={f.placeholder}
                    min={f.type === "number" ? f.min : undefined}
                    max={f.type === "number" ? f.max : undefined}
                    maxLength={f.type === "text" ? f.maxLength : undefined}
                    value={values[f.name]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}
              </label>
            ))}
            {requireReason && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Reason (saved in the audit log)</span>
                <textarea
                  className="min-h-16 rounded-lg border border-border bg-background p-2"
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you doing this?"
                />
              </label>
            )}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant={destructive ? "destructive" : "glow"} onClick={submit} disabled={busy} className={cn(destructive && "text-white")}>
              {busy && <Loader2 className="animate-spin" />} {confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
