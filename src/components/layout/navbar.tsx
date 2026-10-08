"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Sparkles } from "lucide-react"
import { LogoMark } from "@/components/shared/logo-mark"
import { ButtonLink } from "@/components/shared/button-link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { mainNav } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { WalletButton } from "@/components/billing/wallet-button"

/** `site`: marketing pages, with a wallet button that opens the app. `app`: dashboard and tools. */
export function Navbar({ variant = "site" }: { variant?: "site" | "app" }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <LogoMark />
        {variant === "site" && (
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
                  pathname.startsWith(item.href) && "bg-foreground/5 text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <WalletButton variant={variant} />
          {variant === "app" && (
            <ButtonLink href="/create" variant="glow" size="lg" className="hidden px-4 sm:inline-flex">
              <Sparkles /> Create
            </ButtonLink>
          )}
          {variant === "site" && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")} aria-label="Open menu">
                <Menu />
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <span className="font-heading text-lg font-extrabold">Menu</span>
                  </SheetTitle>
                </SheetHeader>
                <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 pb-8">
                  {mainNav.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-foreground/5">
                      {item.label}
                    </Link>
                  ))}
                  <div className="mt-6" onClick={() => setOpen(false)}>
                    <WalletButton variant="site" block />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
