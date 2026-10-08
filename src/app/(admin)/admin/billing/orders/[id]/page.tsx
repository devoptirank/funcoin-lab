import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CircleAlert, ExternalLink } from "lucide-react"
import { adminBase } from "@/lib/admin/base"
import { requireAdmin } from "@/lib/admin/guard"
import { can } from "@/lib/admin/permissions"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { adminHref } from "@/components/admin/admin-href"
import { MaskedAddress } from "@/components/admin/masked-address"
import { AdminHeader, Badge, Empty, Panel, Table, When, statusTone, usd } from "@/components/admin/ui"
import { BillingAction } from "@/components/admin/billing/billing-action"
import { JsonView } from "@/components/admin/billing/json-view"
import { displayAmount, escapeLike, overdue, solscanTx, type EventRow, type OrderRow } from "@/components/admin/billing/data"

export const metadata: Metadata = { title: "Order" }

type LedgerRow = { id: string; delta: number; reason: string; ref: string; created_at: string }

const METHOD_LABEL: Record<string, string> = { sol: "SOL", usdc: "USDC", nowpayments: "NOWPayments" }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-all">{children}</dd>
    </div>
  )
}

function LedgerTable({ rows, empty }: { rows: LedgerRow[]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>
  return (
    <Table>
      <thead>
        <tr>
          <th>When</th>
          <th className="text-right">Change</th>
          <th>Reason</th>
          <th>Ref</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.id}>
            <td><When iso={e.created_at} /></td>
            <td className={`text-right font-semibold tabular-nums ${e.delta < 0 ? "text-destructive" : ""}`}>{e.delta > 0 ? `+${e.delta}` : e.delta}</td>
            <td className="break-words">{e.reason}</td>
            <td className="font-mono text-xs">{e.ref}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin("billing.read")
  const { id } = await params
  const base = await adminBase()
  const back = (
    <Link href={adminHref(base, "/billing")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> Back to orders
    </Link>
  )

  const sb = getSupabaseAdmin()
  if (!sb) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {back}
        <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Supabase isn&apos;t connected on this deployment, so order details are unavailable and the panel is read-only.
        </p>
      </div>
    )
  }
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) notFound()

  const [orderRes, ledgerRes, refundRes, eventsRes] = await Promise.all([
    sb.from("payment_orders").select("*").eq("id", id).maybeSingle(),
    sb.from("credit_ledger").select("id, delta, reason, ref, created_at").eq("ref", `order:${id}`).order("created_at", { ascending: false }),
    sb.from("credit_ledger").select("id, delta, reason, ref, created_at").like("ref", `refund:${escapeLike(id)}%`).order("created_at", { ascending: false }),
    sb.from("payment_events").select("id, provider, order_id, status, body, created_at").eq("order_id", id).order("created_at", { ascending: false }).limit(200),
  ])
  if (orderRes.error) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {back}
        <p className="rounded-xl border border-border bg-card p-4 text-sm">Couldn&apos;t load this order: {orderRes.error.message}</p>
      </div>
    )
  }
  const o = orderRes.data as OrderRow | null
  if (!o) notFound()

  const ledger = (ledgerRes.data ?? []) as LedgerRow[]
  const refunds = (refundRes.data ?? []) as LedgerRow[]
  const events = (eventsRes.data ?? []) as EventRow[]
  const { data: balanceData } = await sb.rpc("billing_balance", { p_account: o.account_id })
  const balance = Number(balanceData ?? 0) || 0
  const { data: priorRecorded } = await sb.from("admin_audit").select("id").eq("action", "order.refund_recorded").eq("target_type", "order").eq("target_id", o.id).limit(1)
  const refundDone = refunds.some((r) => r.ref === `refund:${o.id}`) || Boolean(priorRecorded?.length)
  const unspent = Math.max(0, Math.min(o.credits, balance))

  const wallet = o.method === "sol" || o.method === "usdc"
  const showReverify = wallet && o.status !== "paid" && can(admin.role, "orders.reverify")
  const showRecheck = o.method === "nowpayments" && o.status !== "paid" && can(admin.role, "orders.reverify")
  const showRefund = o.status === "paid" && !refundDone && can(admin.role, "orders.refund")
  const endpoint = (action: string) => `/api/admin/billing/orders/${encodeURIComponent(o.id)}/${action}`

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {back}
      <AdminHeader
        title={`Order ${o.id}`}
        description={`${o.credits} credits for ${usd(Number(o.usd))} via ${METHOD_LABEL[o.method] ?? o.method}`}
        actions={
          <>
            {showReverify && (
              <BillingAction
                label="Re-verify on-chain"
                endpoint={endpoint("reverify")}
                title="Re-verify this payment on-chain"
                description="Runs the same Solana check as the customer's confirm step. The order is marked paid and credits granted only if a valid transaction for this order's reference paid at least the quoted amount. Leave the signature empty to use the stored one or search by reference."
                fields={[{ name: "signature", label: "Transaction signature (optional)", type: "text", placeholder: o.signature ?? "Paste a signature", maxLength: 120 }]}
                confirmLabel="Re-verify"
              />
            )}
            {showRecheck && (
              <BillingAction
                label="Re-check NOWPayments"
                endpoint={endpoint("recheck")}
                title="Re-check with NOWPayments"
                description={`Asks NOWPayments for the payment status. The order is marked paid only if the payment belongs to this order, is "finished", and covers ${usd(Number(o.usd))} USD. This order stores invoice id ${o.provider_id ?? "none"}; the status API needs a payment id, taken from the IPN log or pasted below.`}
                fields={[{ name: "paymentId", label: "NOWPayments payment id (optional)", type: "text", placeholder: "e.g. 5524759814", maxLength: 24 }]}
                confirmLabel="Re-check"
              />
            )}
            {showRefund && (
              <BillingAction
                label="Record refund"
                endpoint={endpoint("refund")}
                destructive
                title="Record a manual refund"
                description={`Send the refund from the merchant wallet first; this panel never sends funds. Recording it removes ${unspent} unspent credits (the smaller of the ${o.credits} bought and the current balance of ${balance}) and writes the audit log. It needs a wallet signature and can only be done once per order.`}
                fields={[
                  { name: "amount", label: "Amount refunded", type: "text", placeholder: "e.g. 0.05 SOL", maxLength: 60 },
                  { name: "txSignature", label: "Refund transaction signature", type: "text", placeholder: "Signature or provider refund id", maxLength: 140 },
                ]}
                confirmLabel="Record refund"
              />
            )}
          </>
        }
      />

      {overdue(o) && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
          This order is still pending after its payment window closed. Re-verify or re-check it if the customer says they paid.
        </p>
      )}

      <Panel title="Order">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Status">
            <Badge tone={statusTone(o.status)}>{o.status}</Badge>
            {refundDone && <span className="ml-1"><Badge tone="warn">refund recorded</Badge></span>}
          </Field>
          <Field label="Wallet">
            <span className="inline-flex items-center gap-2">
              <MaskedAddress value={o.account_id} />
              <Link href={adminHref(base, `/users/${encodeURIComponent(o.account_id)}`)} className="text-xs underline underline-offset-2">Open user</Link>
            </span>
          </Field>
          <Field label="Current balance">{balance} credits</Field>
          <Field label="Pack">{o.pack_id}</Field>
          <Field label="Credits">{o.credits}</Field>
          <Field label="Price">{usd(Number(o.usd))}</Field>
          <Field label="Method">{METHOD_LABEL[o.method] ?? o.method}</Field>
          <Field label="Quoted amount">
            {displayAmount(o)} <span className="font-mono text-xs text-muted-foreground">({o.amount})</span>
          </Field>
          <Field label="Recipient">{o.recipient ? <MaskedAddress value={o.recipient} /> : "-"}</Field>
          <Field label="Reference key">{o.reference ? <MaskedAddress value={o.reference} /> : "-"}</Field>
          <Field label="Provider id">{o.provider_id ? <span className="font-mono text-xs">{o.provider_id}</span> : "-"}</Field>
          <Field label="Transaction">
            {o.signature ? (
              <a href={solscanTx(o.signature)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs underline underline-offset-2">
                {o.signature.slice(0, 10)}...{o.signature.slice(-8)} <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              "-"
            )}
          </Field>
          <Field label="Created"><When iso={o.created_at} /></Field>
          <Field label="Expires"><When iso={o.expires_at} /></Field>
          <Field label="Paid"><When iso={o.paid_at} /></Field>
        </dl>
      </Panel>

      <Panel title="Ledger entry for this order">
        <LedgerTable rows={ledger} empty={o.status === "paid" ? "Paid, but no ledger entry was found for this order. Check the credit ledger." : "No credits granted yet."} />
      </Panel>

      <Panel title="Refunds">
        <LedgerTable rows={refunds} empty={refundDone ? "A refund was recorded with no credits removed (the balance was 0). See the audit log." : "No refund recorded."} />
      </Panel>

      <Panel title={`Provider events (${events.length})`}>
        {!events.length ? (
          <Empty>No webhook events logged for this order.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td><When iso={e.created_at} /></td>
                  <td>{e.provider}</td>
                  <td><Badge tone={statusTone(e.status)}>{e.status || "none"}</Badge></td>
                  <td><JsonView value={e.body} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
