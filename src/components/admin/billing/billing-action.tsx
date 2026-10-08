"use client"
import { toast } from "sonner"
import { AdminAction } from "@/components/admin/admin-action"

/** AdminAction that also shows the server's plain-language result message (paid, already paid, refund recorded). */
export function BillingAction(props: Omit<React.ComponentProps<typeof AdminAction>, "onDone">) {
  return (
    <AdminAction
      {...props}
      onDone={(result) => {
        const message = (result as { message?: unknown } | null)?.message
        if (typeof message === "string" && message) toast.info(message, { duration: 8000 })
      }}
    />
  )
}
