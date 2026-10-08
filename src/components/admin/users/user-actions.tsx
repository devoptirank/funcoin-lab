import { Ban, Coins, EyeOff, NotebookPen, PauseCircle, PlayCircle } from "lucide-react"
import { can, type AdminRole } from "@/lib/admin/permissions"
import { AdminAction } from "@/components/admin/admin-action"

/** The action buttons on a user's detail page. Each button only appears when the admin may use it. */
export function UserActions({
  role,
  account,
  short,
  status,
  notes,
  cap,
  publishedCount,
  isSelf,
}: {
  role: AdminRole
  account: string
  short: string
  status: string
  notes: string
  cap: number
  publishedCount: number
  isSelf: boolean
}) {
  const api = `/api/admin/users/${encodeURIComponent(account)}`
  const large = can(role, "credits.adjust.large")
  return (
    <div className="flex flex-wrap gap-2">
      {can(role, "credits.adjust") && (
        <AdminAction
          label={
            <>
              <Coins aria-hidden /> Adjust credits
            </>
          }
          endpoint={`${api}/credits`}
          title="Grant or deduct credits"
          description={`Adds credits to ${short} (positive number) or removes them (negative number). Changes above ${cap} credits ${large ? "need a wallet signature" : "need an admin or owner"}. A balance can never go below zero.`}
          fields={[{ name: "delta", label: "Credits (use a minus sign to deduct)", type: "number", placeholder: "e.g. 50 or -20" }]}
          confirmLabel="Apply change"
        />
      )}
      {can(role, "accounts.notes") && (
        <AdminAction
          label={
            <>
              <NotebookPen aria-hidden /> Edit notes
            </>
          }
          endpoint={`${api}/notes`}
          title="Edit internal notes"
          description="Internal notes are only visible to admins. Saving replaces the current notes."
          fields={[{ name: "notes", label: "Notes", type: "textarea", defaultValue: notes, maxLength: 4000 }]}
          confirmLabel="Save notes"
        />
      )}
      {can(role, "accounts.status") && !isSelf && (
        <>
          {status !== "active" && (
            <AdminAction
              label={
                <>
                  <PlayCircle aria-hidden /> Reinstate
                </>
              }
              endpoint={`${api}/status`}
              payload={{ status: "active" }}
              title="Reinstate this wallet"
              description={`Sets ${short} back to active. The wallet can sign in, generate and publish again.`}
              confirmLabel="Reinstate"
            />
          )}
          {status === "active" && (
            <AdminAction
              label={
                <>
                  <PauseCircle aria-hidden /> Suspend
                </>
              }
              endpoint={`${api}/status`}
              payload={{ status: "suspended" }}
              title="Suspend this wallet"
              description={`Suspends ${short}. The wallet can't use the app or spend credits until it is reinstated. Its data and published sites are kept.`}
              confirmLabel="Suspend wallet"
              destructive
            />
          )}
          {status !== "banned" && (
            <AdminAction
              label={
                <>
                  <Ban aria-hidden /> Ban
                </>
              }
              endpoint={`${api}/status`}
              payload={{ status: "banned" }}
              title="Ban this wallet"
              description={`Bans ${short}. The wallet is blocked from the app and its published sites are hidden from the public. This needs a signature from your wallet.`}
              confirmLabel="Ban wallet"
              destructive
            />
          )}
        </>
      )}
      {can(role, "sites.unpublish") && publishedCount > 0 && (
        <AdminAction
          label={
            <>
              <EyeOff aria-hidden /> Unpublish all sites
            </>
          }
          endpoint={`${api}/unpublish`}
          title="Unpublish all sites"
          description={`Unpublishes all ${publishedCount} published ${publishedCount === 1 ? "site" : "sites"} owned by ${short}. They go offline and leave Discover. The owner can publish them again unless the wallet is suspended or banned.`}
          confirmLabel={`Unpublish ${publishedCount} ${publishedCount === 1 ? "site" : "sites"}`}
          destructive
        />
      )}
    </div>
  )
}
