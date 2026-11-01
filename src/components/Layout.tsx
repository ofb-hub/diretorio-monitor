import { Link, NavLink, useLocation, useMatch, useResolvedPath } from 'react-router-dom'
import {
  Building2,
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
import { Logo, LogoMark } from './Logo'
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

function Brand() {
  return (
    <NavLink to="/participantes" aria-label="OpenMirror — início" className="min-w-0 rounded-lg">
      <Logo />
    </NavLink>
  )
}

// Faixa da marca no topo da sidebar: altura fixa e linha embaixo, para o nome
// ter um lugar próprio, separado da navegação. Um leve brilho verde no topo.
const brandBarClass =
  'flex h-16 shrink-0 items-center border-b bg-linear-to-b from-primary/[0.07] to-transparent'

/**
 * Item do menu. O estado ativo é calculado aqui (useMatch) e o className vai
 * como string: na sidebar recolhida o link fica dentro de um TooltipTrigger
 * (asChild), que mescla classes como texto — um className em função, como o
 * do NavLink, virava a string do código da função e nenhuma classe valia.
 */
function NavItem({
  to,
  label,
  icon: Icon,
  end,
  compact,
}: (typeof nav)[number] & { compact: boolean }) {
  const resolved = useResolvedPath(to)
  const isActive = useMatch({ path: resolved.pathname, end }) !== null

  const link = (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg py-2 text-sm transition-colors',
        compact ? 'justify-center px-0' : 'px-3',
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {!compact && label}
    </Link>
  )

  if (!compact) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
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
      <div className="p-3">
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
        {nav.map((item) => (
          <NavItem key={item.to} {...item} compact={compact} />
        ))}
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
          <div className={cn(brandBarClass, 'px-4')}>
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
        {compact ? (
          // Recolhida: só o logo. Ao passar o mouse ele vira o ícone de
          // expandir, e o clique abre a sidebar.
          <div className={cn(brandBarClass, 'justify-center')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label="Expandir menu"
                  className="group relative flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:bg-muted"
                >
                  <LogoMark className="size-7 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
                  <PanelLeftOpen className="absolute size-4.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className={cn(brandBarClass, 'justify-between gap-2 pr-2 pl-4')}>
            <Brand />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setCollapsed(true)}
                  aria-label="Recolher menu"
                  className="shrink-0 text-muted-foreground"
                >
                  <PanelLeftClose />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Recolher menu</TooltipContent>
            </Tooltip>
          </div>
        )}
        <SidebarBody compact={compact} />
      </aside>

      {/* Conteúdo — overflow-x-clip (e não hidden) para não quebrar position:sticky */}
      <main className="min-w-0 flex-1 overflow-x-clip px-4 py-5 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}
