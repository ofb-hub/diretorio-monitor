import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Organisation } from '../types'
import { CACHE_TTL_MS, fetchDirectory } from './directory'

// De quanto em quanto tempo checamos se os dados venceram. A checagem é barata
// (só compara datas); a rede só é usada quando o snapshot passou do TTL.
const AUTO_REFRESH_CHECK_MS = 60 * 1000

interface DirectoryState {
  organisations: Organisation[]
  loading: boolean
  error: string | null
  fetchedAt: number | null
  refresh: () => void
}

const Ctx = createContext<DirectoryState | null>(null)

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  // Espelhos em ref para a checagem periódica não precisar se reinscrever.
  const fetchedAtRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)

  const load = useCallback(async (force: boolean) => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const { snapshot } = await fetchDirectory(force)
      // Mesmo snapshot de antes (ex.: rede falhou e voltou o cache): não troca a
      // lista, para não re-renderizar tudo à toa.
      if (snapshot.fetchedAt !== fetchedAtRef.current) {
        fetchedAtRef.current = snapshot.fetchedAt
        setOrganisations(snapshot.organisations)
        setFetchedAt(snapshot.fetchedAt)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar o diretório',
      )
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  // Atualização automática: quando o snapshot passa do TTL (15 min, o mesmo
  // max-age do servidor), busca de novo — só com a aba visível. Ao voltar para
  // a aba depois de um tempo fora, atualiza na hora se já venceu.
  useEffect(() => {
    const refreshIfStale = () => {
      if (document.hidden) return
      const at = fetchedAtRef.current
      if (at !== null && Date.now() - at >= CACHE_TTL_MS) void load(false)
    }
    const timer = window.setInterval(refreshIfStale, AUTO_REFRESH_CHECK_MS)
    document.addEventListener('visibilitychange', refreshIfStale)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfStale)
    }
  }, [load])

  const value = useMemo<DirectoryState>(
    () => ({
      organisations,
      loading,
      error,
      fetchedAt,
      refresh: () => void load(true),
    }),
    [organisations, loading, error, fetchedAt, load],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDirectory(): DirectoryState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDirectory deve ser usado dentro de DirectoryProvider')
  return ctx
}
