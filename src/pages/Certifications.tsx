import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { flattenCerts } from '../lib/directory'
import { Card, CertHealthBadge, PageHeader } from '../components/ui'
import type { CertHealth } from '../types'

const FILTERS: { key: CertHealth | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'expired', label: 'Expiradas' },
  { key: 'expiring', label: 'Expirando ≤90d' },
  { key: 'ok', label: 'Válidas' },
]

export function Certifications() {
  const { organisations } = useDirectory()
  const rows = useMemo(() => flattenCerts(organisations), [organisations])
  const [filter, setFilter] = useState<CertHealth | 'all'>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c = { ok: 0, expiring: 0, expired: 0, unknown: 0 }
    for (const r of rows) c[r.health]++
    return c
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => (filter === 'all' ? true : r.health === filter))
      .filter(
        (r) =>
          !q ||
          r.organisationName.toLowerCase().includes(q) ||
          r.serverName.toLowerCase().includes(q) ||
          (r.profileVariant ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => {
        // Prioriza o que precisa de atenção: expiradas primeiro, depois por data.
        const order = { expired: 0, expiring: 1, ok: 2, unknown: 3 }
        if (order[a.health] !== order[b.health]) return order[a.health] - order[b.health]
        return (a.daysToExpire ?? 1e9) - (b.daysToExpire ?? 1e9)
      })
  }, [rows, filter, query])

  return (
    <>
      <PageHeader
        title="Certificações"
        subtitle="Monitoramento de conformidade das certificações dos authorisation servers"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Expiradas" value={counts.expired} tone="danger" />
        <SummaryTile label="Expirando ≤90d" value={counts.expiring} tone="warn" />
        <SummaryTile label="Válidas" value={counts.ok} tone="ok" />
        <SummaryTile label="Sem data" value={counts.unknown} tone="neutral" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por organização, server ou perfil…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                filter === f.key
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface-2)] text-left text-xs text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Organização</th>
                <th className="px-4 py-2 font-medium">Server</th>
                <th className="px-4 py-2 font-medium">Perfil</th>
                <th className="px-4 py-2 font-medium">Início</th>
                <th className="px-4 py-2 font-medium">Expiração</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.certificationId}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-4 py-2">
                    <CertHealthBadge health={r.health} days={r.daysToExpire} />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/participantes/${r.organisationId}`}
                      className="text-[var(--color-brand-2)] hover:underline"
                    >
                      {r.organisationName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">{r.serverName}</td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {r.profileVariant ?? r.profileType ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">{r.startDate ?? '—'}</td>
                  <td className="px-4 py-2">{r.expirationDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-2 text-xs text-[var(--color-muted)]">
        {filtered.length.toLocaleString('pt-BR')} certificações
      </div>
    </>
  )
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'ok' | 'warn' | 'danger' | 'neutral'
}) {
  const color: Record<string, string> = {
    ok: 'text-[var(--color-ok)]',
    warn: 'text-[var(--color-warn)]',
    danger: 'text-[var(--color-danger)]',
    neutral: 'text-[var(--color-text)]',
  }
  return (
    <Card className="p-4">
      <div className={`text-3xl font-bold ${color[tone]}`}>{value.toLocaleString('pt-BR')}</div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{label}</div>
    </Card>
  )
}
