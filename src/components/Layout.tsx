import { NavLink } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  RefreshCw,
  Landmark,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatDateTime } from '../lib/directory'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/participantes', label: 'Participantes', icon: Building2 },
  { to: '/apis', label: 'APIs', icon: Boxes },
  { to: '/certificacoes', label: 'Certificações', icon: ShieldCheck },
]

export function Layout({ children }: { children: ReactNode }) {
  const { fetchedAt, fromCache, loading, refresh, organisations } = useDirectory()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 px-5 py-5">
          <Landmark className="text-[var(--color-brand)]" size={26} />
          <div className="leading-tight">
            <div className="font-bold">Open Finance BR</div>
            <div className="text-xs text-[var(--color-muted)]">
              Diretório · Monitoramento
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-4 py-4 text-xs text-[var(--color-muted)]">
          {organisations.length > 0 && (
            <div className="mb-1">{organisations.length} organizações</div>
          )}
          {fetchedAt && (
            <div className="mb-2">
              Atualizado: {formatDateTime(fetchedAt)}
              {fromCache && ' (cache)'}
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 hover:border-[var(--color-brand)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar dados
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-x-hidden px-8 py-6">{children}</main>
    </div>
  )
}
