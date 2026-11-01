import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Organisation } from '../types'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NumberTicker } from '@/components/ui/number-ticker'

type Metric = 'apis' | 'servers'

const METRIC_LABEL: Record<Metric, string> = {
  apis: 'APIs',
  servers: 'Authorisation Servers',
}

interface Row {
  id: string
  name: string
  logo: string | null
  apis: number
  servers: number
}

/** Logo da organização: o do primeiro Authorisation Server que tiver um. */
function orgLogo(org: Organisation): string | null {
  return (org.AuthorisationServers ?? []).find((s) => s.CustomerFriendlyLogoUri)
    ?.CustomerFriendlyLogoUri ?? null
}

function initials(name: string): string {
  return name
    .replace(/\b(S\.?A\.?|LTDA|BCO|BANCO)\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function Logo({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
        {initials(name)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className="size-9 shrink-0 rounded-lg bg-white/5 object-contain p-1"
    />
  )
}

/**
 * Top N organizações por número de APIs ou de Authorisation Servers.
 * Ao trocar a aba, as linhas deslizam para a nova posição (layout animation
 * do motion) e quem sai/entra no top N aparece/some suavemente.
 */
export function TopRanking({
  organisations,
  limit = 10,
}: {
  organisations: Organisation[]
  limit?: number
}) {
  const [metric, setMetric] = useState<Metric>('apis')

  const rows = useMemo<Row[]>(
    () =>
      organisations.map((org) => {
        const servers = org.AuthorisationServers ?? []
        return {
          id: org.OrganisationId,
          name: org.OrganisationName,
          logo: orgLogo(org),
          servers: servers.length,
          apis: servers.reduce((n, s) => n + (s.ApiResources ?? []).length, 0),
        }
      }),
    [organisations],
  )

  // Empate na métrica escolhida: desempata pela outra, depois pelo nome.
  const other: Metric = metric === 'apis' ? 'servers' : 'apis'
  const top = [...rows]
    .sort(
      (a, b) =>
        b[metric] - a[metric] || b[other] - a[other] || a.name.localeCompare(b.name),
    )
    .slice(0, limit)
  const max = top[0]?.[metric] || 1

  return (
    <div>
      <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)} className="mb-4">
        <TabsList>
          <TabsTrigger value="apis">{METRIC_LABEL.apis}</TabsTrigger>
          <TabsTrigger value="servers">{METRIC_LABEL.servers}</TabsTrigger>
        </TabsList>
      </Tabs>

      <ol className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {top.map((row, i) => (
            <motion.li
              key={row.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <Link
                to={`/participantes/${row.id}`}
                className="grid grid-cols-[2rem_auto_minmax(0,1fr)_4.5rem] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <span
                  className={
                    i < 3
                      ? 'text-right font-heading text-lg font-semibold text-primary'
                      : 'text-right text-sm text-muted-foreground tabular-nums'
                  }
                >
                  {i + 1}º
                </span>
                <Logo src={row.logo} name={row.name} />
                <div className="min-w-0">
                  <div className="mb-1.5 truncate text-sm font-medium">{row.name}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-primary to-info"
                      initial={false}
                      animate={{ width: `${(row[metric] / max) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 24 }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <NumberTicker
                    value={row[metric]}
                    className="font-heading text-lg font-semibold tabular-nums"
                  />
                  <div className="text-[11px] text-muted-foreground">
                    {metric === 'apis' ? 'APIs' : 'servers'}
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  )
}
