import { NavLink } from 'react-router-dom'
import {
  Building2,
  RefreshCw,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatDateTime } from '../lib/directory'

// Abas temporariamente desabilitadas (Dashboard, APIs, Certificações).
// As páginas e rotas continuam no código — basta reincluir aqui para reativar.
// import { LayoutDashboard, ShieldCheck, Boxes } from 'lucide-react'
const nav = [
  { to: '/participantes', label: 'Participantes', icon: Building2, end: false },
  // { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  // { to: '/apis', label: 'APIs', icon: Boxes },
  // { to: '/certificacoes', label: 'Certificações', icon: ShieldCheck },
]

const COLLAPSE_KEY = 'ofbr-sidebar-collapsed'

export function Layout({ children }: { children: ReactNode }) {
  const { fetchedAt, fromCache, loading, refresh, organisations } = useDirectory()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Cabeçalho + toggle */}
        <div
          className={`flex items-center py-5 ${
            collapsed ? 'justify-center px-0' : 'gap-2 px-5'
          }`}
        >
          <Landmark className="shrink-0 text-[var(--color-brand)]" size={26} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate font-bold">Open Finance BR</div>
              <div className="truncate text-xs text-[var(--color-muted)]">
                Diretório · Monitoramento
              </div>
            </div>
          )}
        </div>

        <div className={`mb-2 flex ${collapsed ? 'justify-center' : 'justify-end px-3'}`}>
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg py-2 text-sm transition ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div
          className={`mt-auto py-4 text-xs text-[var(--color-muted)] ${
            collapsed ? 'px-2' : 'px-4'
          }`}
        >
          {!collapsed && organisations.length > 0 && (
            <div className="mb-1">{organisations.length} organizações</div>
          )}
          {!collapsed && fetchedAt && (
            <div className="mb-2">
              Atualizado: {formatDateTime(fetchedAt)}
              {fromCache && ' (cache)'}
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            title="Atualizar dados"
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] py-2 hover:border-[var(--color-brand)] disabled:opacity-50 ${
              collapsed ? 'px-0' : 'px-3'
            }`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {!collapsed && 'Atualizar dados'}
          </button>
        </div>
      </aside>

      {/* Conteúdo — overflow-x-clip (e não hidden) para não quebrar position:sticky */}
      <main className="flex-1 overflow-x-clip px-8 py-6">{children}</main>
    </div>
  )
}
