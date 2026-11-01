// Componentes da app, construídos sobre os primitivos do shadcn/ui
// (src/components/ui/*). As páginas usam estes — com a API da app (tone,
// segmentos, IDs) — e os do shadcn diretamente quando faz sentido.

import { type ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge as UiBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DotPattern } from '@/components/ui/dot-pattern'
import { NumberTicker } from '@/components/ui/number-ticker'

// ---- Badge ----

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<Tone, string> = {
  ok: 'bg-ok/15 text-ok border-ok/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  danger: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-info/15 text-info border-info/30',
  neutral: 'bg-secondary text-muted-foreground border-border',
}

/** Badge do shadcn com os tons da app. Com `title`, mostra um tooltip. */
export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode
  tone?: Tone
  title?: string
}) {
  const badge = (
    <UiBadge variant="outline" className={toneClasses[tone]}>
      {children}
    </UiBadge>
  )
  if (!title) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}

// ---- Card simples (páginas fora do menu) ----

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl bg-card ring-1 ring-foreground/10', className)}>
      {children}
    </div>
  )
}

// ---- KPI Card ----

export function KpiCard({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  icon?: ReactNode
}) {
  const accent: Record<Tone, string> = {
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-destructive',
    info: 'text-info',
    neutral: 'text-foreground',
  }
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className={accent[tone]}>{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
}

// ---- Spinner / estados ----

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

/** Skeleton do primeiro carregamento — imita a lista de participantes. */
export function ListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-52" />
      <Skeleton className="mb-6 h-4 w-64" />
      <Skeleton className="mb-4 h-9 w-full" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Carregando diretório do Open Finance Brasil…
      </div>
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="text-destructive">Erro ao carregar dados</span>
      <span className="max-w-md text-sm text-muted-foreground">{message}</span>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

// ---- Cabeçalho de página ----

// Bloco com fundo de pontinhos (DotPattern, Magic UI) que somem em direção ao
// título e um brilho verde/azul no canto. `eyebrow` é uma linha pequena acima
// do título (ex.: <LiveBadge />); `actions` fica à direita (ou embaixo, no mobile).
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="relative isolate mb-6 overflow-hidden rounded-2xl bg-card/60 px-5 py-5 ring-1 ring-foreground/10 sm:px-6">
      <DotPattern
        width={18}
        height={18}
        cr={1}
        className="-z-10 text-foreground/10 [mask-image:linear-gradient(to_left,white,transparent_65%)]"
      />
      <div className="pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-linear-to-br from-primary/25 to-info/20 blur-3xl" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2.5">{eyebrow}</div>}
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  )
}

/** Selo "ao vivo" com ponto pulsando — os dados se atualizam sozinhos. */
export function LiveBadge({ children = 'Dados ao vivo do diretório' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {children}
    </span>
  )
}

/** Número em destaque com contagem animada (NumberTicker) e rótulo. */
export function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-background/60 px-3.5 py-2 ring-1 ring-foreground/10 backdrop-blur">
      <NumberTicker
        value={value}
        className="block font-heading text-xl font-semibold tracking-tight tabular-nums"
      />
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

// ---- Copiar IDs ----

async function copyId(id: string, label: string) {
  try {
    await navigator.clipboard.writeText(id)
    toast.success(`${label} copiado`, { description: id })
  } catch {
    toast.error('Não foi possível copiar')
  }
}

// Tag de ID (destaque, clique copia). Usado nos cards/headers clicáveis. Esses
// cards não envolvem o conteúdo num <a>/<button>: usam um link/botão "esticado"
// (absolute inset-0) por baixo, e a tag fica acima dele (relative z-10) —
// assim é um <button> de verdade, sem elemento interativo aninhado.
export function IdTag({
  id,
  label = 'ID',
  className = '',
}: {
  id: string
  label?: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copyId(id, label)}
          aria-label={`Copiar ${label} ${id}`}
          className={cn(
            'relative z-10 inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-info/30 bg-info/10 px-2 py-0.5 transition hover:border-info/70',
            className,
          )}
        >
          <span className="text-[10px] font-bold tracking-wider text-info uppercase">ID</span>
          <span className="truncate font-mono text-[11px] text-foreground">{id}</span>
          <Copy size={11} className="shrink-0 text-muted-foreground opacity-60" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Clique para copiar</TooltipContent>
    </Tooltip>
  )
}

/** ID copiável em destaque (detalhe). */
export function CopyableId({ id, label = 'ID' }: { id: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyId(id, label)}
      className="max-w-full font-mono text-xs text-muted-foreground"
    >
      <span className="truncate">{id}</span>
      <Copy />
    </Button>
  )
}

// ---- Badges de segmento PF/PJ ----

export function SegmentBadges({
  pf,
  pj,
  emptyLabel = 'Segmento não informado',
}: {
  pf: boolean
  pj: boolean
  emptyLabel?: string | null
}) {
  if (!pf && !pj) {
    return emptyLabel ? (
      <span className="text-xs text-muted-foreground">{emptyLabel}</span>
    ) : null
  }
  return (
    <>
      {pf && (
        <Badge tone="ok" title="Suporta Contas PF (Pessoa Física)">
          PF
        </Badge>
      )}
      {pj && (
        <Badge tone="warn" title="Suporta Contas PJ (Pessoa Jurídica)">
          PJ
        </Badge>
      )}
    </>
  )
}

export function CertHealthBadge({
  health,
  days,
}: {
  health: string
  days?: number | null
}) {
  if (health === 'expired')
    return (
      <Badge tone="danger" title={days != null ? `${Math.abs(days)} dias atrás` : undefined}>
        Expirada
      </Badge>
    )
  if (health === 'expiring')
    return (
      <Badge tone="warn" title={days != null ? `expira em ${days} dias` : undefined}>
        Expira ≤90d
      </Badge>
    )
  if (health === 'ok') return <Badge tone="ok">Válida</Badge>
  return <Badge tone="neutral">Sem data</Badge>
}
