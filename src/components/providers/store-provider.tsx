"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { createCloudRepo, localRepo, type Repo } from "@/lib/store/repo"

type StoreValue = {
  repo: Repo
  user: User | null
  ready: boolean
  /** Bumps whenever stored data changes, so lists can refetch. */
  version: number
  bump: () => void
  signOut: () => Promise<void>
  cloudAvailable: boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabaseBrowser()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!sb)
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!sb) return
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setReady(true)
    })
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setVersion((v) => v + 1)
    })
    return () => data.subscription.unsubscribe()
  }, [sb])

  useEffect(() => {
    window.addEventListener("fcl:store", bump)
    return () => window.removeEventListener("fcl:store", bump)
  }, [bump])

  const userId = user?.id
  // Stable per user, so effects that depend on `repo` don't re-run on every data change.
  const repo = useMemo(() => (sb && userId ? createCloudRepo(sb, userId) : localRepo), [sb, userId])

  const value = useMemo<StoreValue>(
    () => ({
      repo,
      user,
      ready,
      version,
      bump,
      cloudAvailable: Boolean(sb),
      signOut: async () => {
        await sb?.auth.signOut()
        setUser(null)
      },
    }),
    [sb, repo, user, ready, version, bump],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}

/** Load data from the repo and reload whenever the store changes. */
export function useRepoData<T>(load: (repo: Repo) => Promise<T>, initial: T) {
  const { repo, ready, version } = useStore()
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!ready) return
    let alive = true
    load(repo)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // `load` is expected to be stable per call site; reload on repo/version changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, ready, version])
  return { data, loading, error, setData }
}
