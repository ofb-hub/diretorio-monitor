import { NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  Landmark,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatDateTime } from '../lib/directory'
import { safeGetItem, safeSetItem } from '../lib/storage'
import { modKeyLabel, openCommandMenu } from '../lib/commandMenu'
import { CommandMenu } from './CommandMenu'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Abas temporariamente desabilitadas (Dashboard, APIs, Certificações).
// As páginas e rotas continuam no código — basta reincluir aqui para reativar.
// import { LayoutDashboard, ShieldCheck, Boxes } from 'lucide-react'
const nav = [
  { to: '/participantes', label: 'Participantes', icon: Building2, end: false },
  { to: '/vitrine', label: 'Vitrine', icon: Sparkles, end: true },
  // { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  // { to: '/apis', label: 'APIs', icon: Boxes },
  // { to: '/certificacoes', label: 'Certificações', icon: ShieldCheck },
]

const COLLAPSE_KEY = 'ofbr-sidebar-collapsed'

// Mesmo breakpoint do `md:` do Tailwind. Abaixo dele a sidebar vira Sheet.
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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', compact && 'justify-center')}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Landmark className="size-4.5" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate font-heading font-semibold">OpenX</div>
          <div className="truncate text-xs text-muted-foreground">Mirror Directory</div>
        </div>
      )}
    </div>
  )
}

/** Conteúdo da sidebar — usado no desktop (aside) e no mobile (Sheet). */
function SidebarBody({ compact }: { compact: boolean }) {
  const { fetchedAt, organisations } = useDirectory()

  const searchButton = (
    <Button
      variant="outline"
      onClick={openCommandMenu}
      className={cn('w-full text-muted-foreground', compact ? 'px-0' : 'justify-start')}
      aria-label="Busca rápida"
    >
      <Search />
      {!compact && (
        <>
          <span className="flex-1 text-left">Busca rápida</span>
          <Kbd>{modKeyLabel} K</Kbd>
        </>
      )}
    </Button>
  )

  return (
    <>
      <div className="px-3 pb-3">
        {compact ? (
          <Tooltip>
            <TooltipTrigger asChild>{searchButton}</TooltipTrigger>
            <TooltipContent side="right">Busca rápida ({modKeyLabel} K)</TooltipContent>
          </Tooltip>
        ) : (
          searchButton
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg py-2 text-sm transition-colors',
                  compact ? 'justify-center px-0' : 'px-3',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4.5 shrink-0" />
              {!compact && label}
            </NavLink>
          )
          return compact ? (
            <Tooltip key={to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>

      {/* Os dados se atualizam sozinhos (DirectoryContext); aqui só informamos quando. */}
      {!compact && (
        <div className="mt-auto px-4 py-4 text-xs text-muted-foreground">
          {organisations.length > 0 && (
            <div className="mb-1">{organisations.length} organizações</div>
          )}
          {fetchedAt && <div>Última atualização: {formatDateTime(fetchedAt)}</div>}
        </div>
      )}
    </>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => safeGetItem(COLLAPSE_KEY) === '1')
  const [sheetOpen, setSheetOpen] = useState(false)
  // Navegou para outra página ou passou para desktop: fecha o Sheet. Ajuste de
  // estado durante o render (padrão do React) — evita um setState em effect.
  const [sheetKey, setSheetKey] = useState(`${pathname}|${isDesktop}`)
  if (sheetKey !== `${pathname}|${isDesktop}`) {
    setSheetKey(`${pathname}|${isDesktop}`)
    setSheetOpen(false)
  }

  // Recolher só existe no desktop; no mobile o Sheet abre sempre expandido.
  const compact = isDesktop && collapsed

  useEffect(() => {
    safeSetItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <CommandMenu />

      {/* Barra superior — só no mobile */}
      <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSheetOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={openCommandMenu}
          aria-label="Busca rápida"
        >
          <Search />
        </Button>
      </header>

      {/* Mobile: menu lateral em Sheet (shadcn) — overlay, Esc e foco já resolvidos */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 gap-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal</SheetDescription>
          <div className="px-4 py-4">
            <Brand />
          </div>
          <SidebarBody compact={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop: sidebar fixa, recolhível */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 md:flex',
          compact ? 'w-16' : 'w-60',
        )}
      >
        <div className={cn('flex items-center py-4', compact ? 'justify-center' : 'px-4')}>
          <Brand compact={compact} />
        </div>
        <div className={cn('mb-2 flex', compact ? 'justify-center' : 'justify-end px-3')}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={compact ? 'Expandir menu' : 'Recolher menu'}
            className="text-muted-foreground"
          >
            {compact ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        <SidebarBody compact={compact} />
      </aside>

      {/* Conteúdo — overflow-x-clip (e não hidden) para não quebrar position:sticky */}
      <main className="min-w-0 flex-1 overflow-x-clip px-4 py-5 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}
