import { NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  Landmark,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatDateTime } from '../lib/directory'
import { safeGetItem, safeSetItem } from '../lib/storage'

// Abas temporariamente desabilitadas (Dashboard, APIs, Certificações).
// As páginas e rotas continuam no código — basta reincluir aqui para reativar.
// import { LayoutDashboard, ShieldCheck, Boxes } from 'lucide-react'
const nav = [
  { to: '/participantes', label: 'Participantes', icon: Building2, end: false },
  // { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  // { to: '/apis', label: 'APIs', icon: Boxes },
  // { to: '/certificacoes', label: 'Certificações', icon: ShieldCheck },
]

const COLLAPSE_KEY = 'ofbr-sidebar-collapsed'

// Mesmo breakpoint do `md:` do Tailwind. Abaixo dele a sidebar vira drawer.
const DESKTOP_QUERY = '(min-width: 768px)'

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(DESKTOP_QUERY)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { fetchedAt, organisations } = useDirectory()
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => safeGetItem(COLLAPSE_KEY) === '1')
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Navegou para outra página ou passou para desktop: fecha o drawer. Ajuste de
  // estado durante o render (padrão do React) — evita um setState em effect.
  const [drawerKey, setDrawerKey] = useState(`${pathname}|${isDesktop}`)
  if (drawerKey !== `${pathname}|${isDesktop}`) {
    setDrawerKey(`${pathname}|${isDesktop}`)
    setDrawerOpen(false)
  }

  // No mobile o drawer abre sempre expandido; recolher só faz sentido no desktop.
  const compact = isDesktop && collapsed

  useEffect(() => {
    safeSetItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barra superior — só no mobile */}
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <Menu size={20} />
        </button>
        <Landmark className="shrink-0 text-[var(--color-brand)]" size={22} />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-bold">OpenX</div>
          <div className="truncate text-xs text-[var(--color-muted)]">Mirror Directory</div>
        </div>
      </header>

      {/* Fundo escurecido atrás do drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (desktop) / drawer (mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 md:sticky md:top-0 md:bottom-auto md:h-screen md:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${compact ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Cabeçalho + toggle */}
        <div
          className={`flex items-center py-5 ${
            compact ? 'justify-center px-0' : 'gap-2 px-5'
          }`}
        >
          <Landmark className="shrink-0 text-[var(--color-brand)]" size={26} />
          {!compact && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate font-bold">OpenX</div>
              <div className="truncate text-xs text-[var(--color-muted)]">
                Mirror Directory
              </div>
            </div>
          )}
          {!isDesktop && (
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isDesktop && (
          <div className={`mb-2 flex ${compact ? 'justify-center' : 'justify-end px-3'}`}>
            <button
              onClick={() => setCollapsed((v) => !v)}
              title={compact ? 'Expandir menu' : 'Recolher menu'}
              aria-label={compact ? 'Expandir menu' : 'Recolher menu'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            >
              {compact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={compact ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg py-2 text-sm transition ${
                  compact ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!compact && label}
            </NavLink>
          ))}
        </nav>

        {/* Os dados se atualizam sozinhos (DirectoryContext); aqui só informamos quando. */}
        {!compact && (
          <div className="mt-auto px-4 py-4 text-xs text-[var(--color-muted)]">
            {organisations.length > 0 && (
              <div className="mb-1">{organisations.length} organizações</div>
            )}
            {fetchedAt && <div>Última atualização: {formatDateTime(fetchedAt)}</div>}
          </div>
        )}
      </aside>

      {/* Conteúdo — overflow-x-clip (e não hidden) para não quebrar position:sticky */}
      <main className="min-w-0 flex-1 overflow-x-clip px-4 py-5 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}
