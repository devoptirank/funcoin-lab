"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, Receipt, Image as ImageIcon, LayoutDashboard, LayoutTemplate, Lightbulb, Megaphone, Palette, Settings, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/ideas", label: "My Ideas", icon: Lightbulb },
  { href: "/dashboard/brands", label: "My Brands", icon: Sparkles },
  { href: "/dashboard/websites", label: "My Websites", icon: LayoutTemplate },
  { href: "/dashboard/domains", label: "Saved Domains", icon: Globe },
  { href: "/dashboard/memes", label: "Meme Generator", icon: ImageIcon },
  { href: "/dashboard/logo", label: "Logo Generator", icon: Palette },
  { href: "/dashboard/social", label: "Social Content", icon: Megaphone },
  { href: "/dashboard/billing", label: "Billing", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href))
  return (
    <>
      {/* Mobile: horizontal tabs */}
      <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto border-b border-border px-4 pb-3 md:hidden">
        <ul className="flex w-max gap-1.5">
          {DASHBOARD_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm", isActive(item.href) ? "bg-lab-fill font-semibold text-lab-ink" : "text-muted-foreground")}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Desktop: sidebar */}
      <nav aria-label="Dashboard" className="sticky top-20 hidden h-fit w-56 shrink-0 md:block">
        <ul className="flex flex-col gap-1">
          {DASHBOARD_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-lab-fill font-semibold text-lab-ink" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
