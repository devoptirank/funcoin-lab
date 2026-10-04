"use client"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBilling } from "./billing-provider"

export function BuyCreditsButton({ label = "Buy credits", className }: { label?: string; className?: string }) {
  const billing = useBilling()
  return (
    <Button variant="glow" size="xl" className={className} onClick={() => billing.openBuy()}>
      <Zap /> {label}
    </Button>
  )
}
