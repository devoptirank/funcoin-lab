"use client"
import { toast } from "sonner"
import { useStore } from "@/components/providers/store-provider"

export function useDeleteProject() {
  const { repo, bump } = useStore()
  return async (id: string, name: string) => {
    if (!window.confirm(`Delete “${name}”? This can't be undone.`)) return
    try {
      await repo.deleteProject(id)
      bump()
      toast.success(`Deleted ${name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete")
    }
  }
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
