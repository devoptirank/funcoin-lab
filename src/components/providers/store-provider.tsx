"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { apiRepo, type Repo } from "@/lib/store/repo"
import { useBilling } from "@/components/billing/billing-provider"

type StoreValue = {
  repo: Repo
  /** The signed-in wallet address, or null. */
  address: string | null
  /** True once we know a wallet is signed in, so data can load. */
  ready: boolean
  /** Bumps whenever stored data changes, so lists can refetch. */
  version: number
  bump: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const billing = useBilling()
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    window.addEventListener("fcl:store", bump)
    return () => window.removeEventListener("fcl:store", bump)
  }, [bump])

  const address = billing.signedIn ? billing.address : null
  const value = useMemo<StoreValue>(
    () => ({ repo: apiRepo, address, ready: !billing.loading && Boolean(address), version, bump }),
    [address, billing.loading, version, bump],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}

/** Load data from the repo and reload whenever the store or the signed-in wallet changes. */
export function useRepoData<T>(load: (repo: Repo) => Promise<T>, initial: T) {
  const { repo, ready, address, version } = useStore()
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
    // `load` is expected to be stable per call site; reload on wallet/version changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, ready, address, version])
  return { data, loading: ready ? loading : false, error, setData }
}
