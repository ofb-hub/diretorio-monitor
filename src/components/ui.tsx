import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

// ---- Badge ----

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<Tone, string> = {
  ok: 'bg-[var(--color-ok)]/15 text-[var(--color-ok)] border-[var(--color-ok)]/30',
  warn: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)] border-[var(--color-warn)]/30',
  danger:
    'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30',
  info: 'bg-[var(--color-brand-2)]/15 text-[var(--color-brand-2)] border-[var(--color-brand-2)]/30',
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)]',
}

export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode
  tone?: Tone
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

// ---- Card ----

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
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
    ok: 'text-[var(--color-ok)]',
    warn: 'text-[var(--color-warn)]',
    danger: 'text-[var(--color-danger)]',
    info: 'text-[var(--color-brand-2)]',
    neutral: 'text-[var(--color-text)]',
  }
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-sm text-[var(--color-muted)]">{label}</span>
        {icon && <span className={accent[tone]}>{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--color-muted)]">{sub}</div>}
    </Card>
  )
}

// ---- Spinner / estados ----

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
      {label && <span className="text-sm">{label}</span>}
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
      <span className="text-[var(--color-danger)]">Erro ao carregar dados</span>
      <span className="max-w-md text-sm text-[var(--color-muted)]">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm hover:border-[var(--color-brand)]"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

// ---- Cabeçalho de página ----

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  )
}

// ---- Badge de status de certificação ----

// ---- ID copiável (UUID) ----

export function CopyableId({
  id,
  label,
}: {
  id: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  }

  return (
    <button
      onClick={copy}
      title={`Copiar ${label ?? 'ID'}: ${id}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs text-[var(--color-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-text)]"
    >
      <span className="truncate">{id}</span>
      {copied ? (
        <Check size={12} className="shrink-0 text-[var(--color-ok)]" />
      ) : (
        <Copy size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
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
      <span className="text-xs text-[var(--color-muted)]">{emptyLabel}</span>
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
