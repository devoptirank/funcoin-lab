"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Sparkles } from "lucide-react"
import { LogoMark } from "@/components/shared/logo-mark"
import { ButtonLink } from "@/components/shared/button-link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { mainNav, toolNav } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./user-menu"
import { WalletButton } from "@/components/billing/wallet-button"

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <LogoMark />
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
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu />
          <WalletButton />
          <ButtonLink href="/create" variant="glow" size="lg" className="hidden px-4 xl:inline-flex">
            <Sparkles /> Create
          </ButtonLink>
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
                {[...mainNav, { href: "/dashboard", label: "Dashboard" }].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-foreground/5">
                    {item.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tools</p>
                {toolNav.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-foreground/5">
                    <span aria-hidden>{item.emoji}</span> {item.label}
                  </Link>
                ))}
                <ButtonLink href="/create" variant="glow" size="xl" className="mt-6" onClick={() => setOpen(false)}>
                  Create My Meme Coin 🚀
                </ButtonLink>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
