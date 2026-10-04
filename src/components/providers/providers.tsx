"use client"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { StoreProvider } from "./store-provider"
import { SolanaProvider } from "./solana-provider"
import { BillingProvider } from "@/components/billing/billing-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <StoreProvider>
        <SolanaProvider>
          <BillingProvider>
            <TooltipProvider>
              {children}
              <Toaster position="bottom-center" richColors closeButton />
            </TooltipProvider>
          </BillingProvider>
        </SolanaProvider>
      </StoreProvider>
    </ThemeProvider>
  )
}
