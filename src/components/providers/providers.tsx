"use client"
import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { StoreProvider } from "./store-provider"
import { SolanaProvider } from "./solana-provider"
import { BillingProvider } from "@/components/billing/billing-provider"
import { ImageQueuePanel } from "@/components/shared/image-queue-panel"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem("fcl:reloaded")
    } catch {}
  }, [])
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <SolanaProvider>
        <BillingProvider>
          <StoreProvider>
            <TooltipProvider>
              {children}
              <ImageQueuePanel />
              <Toaster position="bottom-center" richColors closeButton />
            </TooltipProvider>
          </StoreProvider>
        </BillingProvider>
      </SolanaProvider>
    </ThemeProvider>
  )
}
