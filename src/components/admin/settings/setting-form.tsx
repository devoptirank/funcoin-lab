"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import bs58 from "bs58"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type StepUp = { action: string; summary: string; params: Record<string, unknown> }

/** Shared input styles for the settings forms. */
export const inputCls = "h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
export const labelCls = "flex flex-col gap-1.5 text-sm"

/**
 * Saves one setting with PUT /api/admin/settings/[key]. If the server answers 428 stepup_required,
 * the admin's wallet signs the exact change and the request is retried (same flow as AdminAction).
 */
function useSaveSetting(settingKey: string) {
  const router = useRouter()
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const [busy, setBusy] = useState(false)

  const send = (body: Record<string, unknown>) =>
    fetch(`/api/admin/settings/${settingKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

  const signStepUp = async (s: StepUp) => {
    if (!wallet.connected) {
      setVisible(true)
      throw new Error("Connect your admin wallet, then try again.")
    }
    if (!wallet.signMessage) throw new Error("This wallet can't sign messages.")
    const c = await fetch("/api/admin/stepup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
    const cj = (await c.json().catch(() => ({}))) as { message?: string; token?: string; error?: string }
    if (!c.ok || !cj.message || !cj.token) throw new Error(cj.error || "Couldn't start the confirmation")
    toast.info("Confirm this change in your wallet")
    const signature = bs58.encode(await wallet.signMessage(new TextEncoder().encode(cj.message)))
    return { signature, token: cj.token }
  }

  const save = async (value: unknown, reason: string): Promise<boolean> => {
    setBusy(true)
    try {
      let res = await send({ value, reason })
      let json = (await res.json().catch(() => ({}))) as { error?: string; code?: string; stepUp?: StepUp }
      if (res.status === 428 && json.code === "stepup_required" && json.stepUp) {
        const proof = await signStepUp(json.stepUp)
        res = await send({ value, reason, stepUp: proof })
        json = (await res.json().catch(() => ({}))) as typeof json
      }
      if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`)
      toast.success("Saved. Live within a few seconds.")
      router.refresh()
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed"
      toast.error(/reject|cancel|declin/i.test(msg) ? "Signature cancelled" : msg)
      return false
    } finally {
      setBusy(false)
    }
  }

  return { save, busy }
}

/**
 * A settings form: the fields (children), a required reason for the audit log and a Save button.
 * `getValue` returns the full value to save, or a string with a validation error.
 */
export function SettingForm({
  settingKey,
  getValue,
  canWrite,
  dirty,
  note,
  children,
}: {
  settingKey: string
  getValue: () => unknown | { error: string }
  canWrite: boolean
  dirty: boolean
  /** Shown under the Save button: what the change affects and whether it needs a wallet signature. */
  note?: string
  children: React.ReactNode
}) {
  const { save, busy } = useSaveSetting(settingKey)
  const [reason, setReason] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = getValue()
    if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return toast.error(value.error)
    if (reason.trim().length < 3) return toast.error("Add a reason (at least 3 characters).")
    if (await save(value, reason.trim())) setReason("")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset disabled={!canWrite || busy} className="flex flex-col gap-4 disabled:opacity-80">
        {children}
      </fieldset>
      {canWrite ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end">
          <label className={`${labelCls} flex-1`}>
            <span className="font-medium">Reason (saved in the audit log)</span>
            <input className={inputCls} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you changing this?" disabled={busy} />
          </label>
          <Button type="submit" variant="glow" disabled={busy || !dirty} className="h-9 px-4">
            {busy ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Read-only: your role can&apos;t change settings, or the database isn&apos;t connected.</p>
      )}
      {canWrite && note && <p className="text-xs text-muted-foreground">{note}</p>}
    </form>
  )
}
