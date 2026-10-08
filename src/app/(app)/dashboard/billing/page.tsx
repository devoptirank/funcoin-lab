"use client"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Wallet, Zap } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { useBilling } from "@/components/billing/billing-provider"
import { shortAddress } from "@/components/billing/wallet-button"
import { formatDate } from "@/components/dashboard/project-actions"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-lab-fill text-lab-ink",
  pending: "bg-foreground/10",
  partial: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  expired: "bg-foreground/5 text-muted-foreground",
}

function Billing() {
  const billing = useBilling()
  const params = useSearchParams()
  const returning = params.get("order")

  // Back from NOWPayments: their IPN may land a moment later, so poll briefly.
  useEffect(() => {
    if (!returning || !billing.signedIn) return
    let n = 0
    const id = setInterval(() => {
      n++
      void billing.refresh()
      if (n > 20) clearInterval(id)
    }, 4000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returning, billing.signedIn])

  if (!billing.loading && !billing.signedIn) {
    return (
      <>
        <PageHeader title="Billing" description="Credits and payments for your wallet account." />
        <EmptyState
          mascot="robot"
          title="Connect your wallet"
          description="Your credits and payment history are tied to your Solana wallet."
          action={
            <Button variant="glow" size="lg" className="px-4" onClick={() => void billing.ensureSignedIn()}>
              <Wallet /> Connect wallet
            </Button>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Billing"
        description={billing.address ? `Wallet ${shortAddress(billing.address)}` : undefined}
        action={
          <Button variant="glow" size="lg" className="px-4" onClick={() => billing.openBuy()}>
            <Zap /> Buy credits
          </Button>
        }
      />
      {returning && <p className="mb-4 rounded-2xl border border-border p-4 text-sm">Thanks! We&apos;re waiting for the payment confirmation. Credits appear here automatically.</p>}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="rounded-[2rem] bg-lab-fill p-6 text-lab-ink">
          <p className="text-sm font-semibold opacity-75">Balance</p>
          <p className="mt-2 font-heading text-6xl font-black tabular-nums">{billing.balance}</p>
          <p className="text-sm opacity-75">credits</p>
        </div>
        <section className="rounded-[2rem] border border-border p-6" aria-labelledby="pay-h">
          <h2 id="pay-h" className="font-semibold">Payments</h2>
          {billing.orders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {billing.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    {o.credits} credits · ${o.usd} · {o.method === "nowpayments" ? "NOWPayments" : o.currency}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                    {o.signature && (
                      <a
                        className="underline underline-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://solscan.io/tx/${o.signature}${billing.methods.cluster === "devnet" ? "?cluster=devnet" : ""}`}
                      >
                        tx
                      </a>
                    )}
                    <span className={cn("rounded-full px-2 py-0.5 font-medium capitalize", STATUS_STYLE[o.status])}>{o.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="mt-4 rounded-[2rem] border border-border p-6" aria-labelledby="ledger-h">
        <h2 id="ledger-h" className="font-semibold">Credit history</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {billing.ledger.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2.5">
              <span>{e.reason}</span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
                <span className={cn("w-12 text-right font-mono font-semibold tabular-nums", e.delta > 0 ? "text-lab" : "")}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  )
}
