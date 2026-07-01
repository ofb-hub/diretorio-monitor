import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DirectoryStats, Organisation } from '../types'
import { computeStats, fetchDirectory } from './directory'

interface DirectoryState {
  organisations: Organisation[]
  stats: DirectoryStats | null
  loading: boolean
  error: string | null
  fetchedAt: number | null
  fromCache: boolean
  refresh: () => void
}

const Ctx = createContext<DirectoryState | null>(null)

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const load = useCallback(async (force: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const { snapshot, fromCache } = await fetchDirectory(force)
      setOrganisations(snapshot.organisations)
      setFetchedAt(snapshot.fetchedAt)
      setFromCache(fromCache)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar o diretório',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const stats = useMemo(
    () => (organisations.length ? computeStats(organisations) : null),
    [organisations],
  )

  const value = useMemo<DirectoryState>(
    () => ({
      organisations,
      stats,
      loading,
      error,
      fetchedAt,
      fromCache,
      refresh: () => void load(true),
    }),
    [organisations, stats, loading, error, fetchedAt, fromCache, load],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDirectory(): DirectoryState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDirectory deve ser usado dentro de DirectoryProvider')
  return ctx
}
