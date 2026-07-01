import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { flattenApis, prettyFamily } from '../lib/directory'
import { Badge, Card, PageHeader } from '../components/ui'

export function Apis() {
  const { organisations } = useDirectory()
  const rows = useMemo(() => flattenApis(organisations), [organisations])

  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('')

  const families = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.familyType, (m.get(r.familyType) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => (family ? r.familyType === family : true))
      .filter(
        (r) =>
          !q ||
          r.organisationName.toLowerCase().includes(q) ||
          r.serverName.toLowerCase().includes(q) ||
          r.familyType.toLowerCase().includes(q),
      )
      .slice(0, 500)
  }, [rows, query, family])

  return (
    <>
      <PageHeader
        title="APIs"
        subtitle={`${rows.length.toLocaleString('pt-BR')} APIs declaradas em ${families.length} famílias`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por organização, server ou família…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
        >
          <option value="">Todas as famílias</option>
          {families.map(([f, n]) => (
            <option key={f} value={f}>
              {prettyFamily(f)} ({n})
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface-2)] text-left text-xs text-[var(--color-muted)]">
              <tr>
                <Th>Família</Th>
                <Th>Organização</Th>
                <Th>Server</Th>
                <Th>Versão</Th>
                <Th>Certificação</Th>
                <Th>Endpoints</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.apiResourceId}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                >
                  <Td>
                    <span className="font-medium">{prettyFamily(r.familyType)}</span>
                  </Td>
                  <Td>
                    <Link
                      to={`/participantes/${r.organisationId}`}
                      className="text-[var(--color-brand-2)] hover:underline"
                    >
                      {r.organisationName}
                    </Link>
                  </Td>
                  <Td className="text-[var(--color-muted)]">{r.serverName}</Td>
                  <Td>
                    <Badge tone={r.status === 'Active' ? 'ok' : 'neutral'}>v{r.version}</Badge>
                  </Td>
                  <Td className="text-[var(--color-muted)]">{r.certificationStatus ?? '—'}</Td>
                  <Td>{r.endpointCount}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {filtered.length >= 500 && (
        <div className="mt-2 text-center text-xs text-[var(--color-muted)]">
          Mostrando as primeiras 500 linhas — refine a busca para ver mais.
        </div>
      )}
    </>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-medium">{children}</th>
}
function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>
}
