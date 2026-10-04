"use client"
import Link from "next/link"
import { LayoutDashboard, LogOut, Settings } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/components/providers/store-provider"
import { ButtonLink } from "@/components/shared/button-link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const { user, signOut, cloudAvailable } = useStore()
  if (!user) {
    return (
      <ButtonLink href={cloudAvailable ? "/login" : "/dashboard"} variant="ghost" size="lg" className="hidden sm:inline-flex">
        {cloudAvailable ? "Sign in" : "Dashboard"}
      </ButtonLink>
    )
  }
  const initial = (user.email ?? "?")[0].toUpperCase()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full bg-lab-fill font-bold text-lab-ink"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut()
            toast.success("Signed out")
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
