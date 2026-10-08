"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Activity, Coins, FileClock, Globe, Image as ImageIcon, LayoutDashboard, ListChecks, LogOut, Menu, Settings, ShieldAlert, Users, UsersRound, X } from "lucide-react"
import { toast } from "sonner"
import { shortAddress } from "@/components/billing/wallet-button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { copyText } from "@/lib/client-api"
import { cn } from "@/lib/utils"
import { adminHref } from "./admin-href"

/** Sidebar entries. `ready: false` sections arrive in later milestones and render as disabled. */
const NAV = [
  { path: "/", label: "Overview", icon: LayoutDashboard, ready: true },
  { path: "/users", label: "Users", icon: Users, ready: false },
  { path: "/billing", label: "Billing", icon: Coins, ready: false },
  { path: "/content", label: "Content", icon: ImageIcon, ready: false },
  { path: "/safety", label: "Safety", icon: ShieldAlert, ready: false },
  { path: "/settings", label: "Settings", icon: Settings, ready: false },
  { path: "/domains", label: "Domains", icon: Globe, ready: false },
  { path: "/waitlist", label: "Waitlist", icon: ListChecks, ready: false },
  { path: "/team", label: "Admins", icon: UsersRound, ready: false },
  { path: "/system", label: "System", icon: Activity, ready: false },
  { path: "/audit", label: "Audit log", icon: FileClock, ready: false },
]

export function AdminShell({ base, address, role, env, cluster, children }: { base: string; address: string; role: string; env: string; cluster: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const here = (path: string) => {
    const href = adminHref(base, path)
    return path === "/" ? pathname === href || pathname === `${href}/` : pathname === href || pathname.startsWith(`${href}/`)
  }

  const signOut = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" })
    toast.success("Signed out of admin")
    router.refresh()
  }

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5 p-2">
      {NAV.map((item) =>
        item.ready ? (
          <Link
            key={item.path}
            href={adminHref(base, item.path)}
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm", here(item.path) ? "bg-foreground/10 font-semibold" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")}
          >
            <item.icon className="size-4" aria-hidden /> {item.label}
          </Link>
        ) : (
          <span key={item.path} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50" aria-disabled>
            <item.icon className="size-4" aria-hidden /> {item.label}
            <span className="ml-auto text-[10px] uppercase">Soon</span>
          </span>
        ),
      )}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-3 sm:px-4">
        <button type="button" className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <span className="font-semibold">FunCoin Lab admin</span>
        <span className={cn("hidden rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase sm:inline", env === "production" ? "bg-destructive/15 text-destructive" : "bg-foreground/10")}>{env}</span>
        <span className="hidden rounded bg-foreground/10 px-1.5 py-0.5 text-[11px] font-semibold sm:inline">{cluster}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={async () => (await copyText(address)) && toast.success("Address copied")}
            className="hidden rounded-lg px-2 py-1 font-mono text-xs hover:bg-foreground/5 sm:block"
            title="Copy address"
          >
            {shortAddress(address)}
          </button>
          <span className="rounded bg-lab-fill px-1.5 py-0.5 text-[11px] font-semibold text-lab-ink uppercase">{role}</span>
          <ThemeToggle />
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm hover:bg-foreground/5" title="Sign out of admin">
            <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out of admin</span>
          </button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto border-r border-border md:block">{nav}</aside>
        {open && <aside className="fixed inset-x-0 top-14 bottom-0 z-30 overflow-y-auto border-t border-border bg-background md:hidden">{nav}</aside>}
        <main id="main" className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
