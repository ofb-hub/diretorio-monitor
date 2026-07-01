import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatCnpj, orgSegments } from '../lib/directory'
import { Badge, Card, PageHeader, SegmentBadges } from '../components/ui'

const ALL_ROLES = ['CONTA', 'DADOS', 'PAGTO', 'CCORR']

type SegFilter = '' | 'pf' | 'pj'

export function Participants() {
  const { organisations } = useDirectory()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<string>('')
  const [segment, setSegment] = useState<SegFilter>('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return organisations
      .filter((org) => {
        if (role) {
          const roles = (org.OrgDomainRoleClaims ?? []).map((r) => r.Role)
          if (!roles.includes(role)) return false
        }
        if (segment) {
          const seg = orgSegments(org)
          if (segment === 'pf' && !seg.pf) return false
          if (segment === 'pj' && !seg.pj) return false
        }
        if (!q) return true
        const nameHit =
          org.OrganisationName.toLowerCase().includes(q) ||
          (org.LegalEntityName ?? '').toLowerCase().includes(q)
        const cnpjHit =
          qDigits.length > 0 &&
          (org.RegistrationNumber ?? '').replace(/\D/g, '').includes(qDigits)
        // Busca por ID: OrganisationId ou qualquer AuthorisationServerId da org.
        const idHit =
          org.OrganisationId.toLowerCase().includes(q) ||
          (org.AuthorisationServers ?? []).some((s) =>
            s.AuthorisationServerId.toLowerCase().includes(q),
          )
        return nameHit || cnpjHit || idHit
      })
      .sort((a, b) => a.OrganisationName.localeCompare(b.OrganisationName))
  }, [organisations, query, role, segment])

  return (
    <>
      <PageHeader
        title="Participantes"
        subtitle={`${filtered.length} de ${organisations.length} organizações`}
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
            placeholder="Buscar por nome, CNPJ ou ID (org/server)…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>
        <div className="flex gap-1">
          <FilterChip active={role === ''} onClick={() => setRole('')}>
            Todas
          </FilterChip>
          {ALL_ROLES.map((r) => (
            <FilterChip key={r} active={role === r} onClick={() => setRole(r)}>
              {r}
            </FilterChip>
          ))}
        </div>
        <div className="flex gap-1">
          <FilterChip active={segment === 'pf'} onClick={() => setSegment(segment === 'pf' ? '' : 'pf')}>
            PF
          </FilterChip>
          <FilterChip active={segment === 'pj'} onClick={() => setSegment(segment === 'pj' ? '' : 'pj')}>
            PJ
          </FilterChip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((org) => {
          const roles = [
            ...new Set((org.OrgDomainRoleClaims ?? []).map((r) => r.Role).filter(Boolean)),
          ] as string[]
          const serverCount = (org.AuthorisationServers ?? []).length
          const apiCount = (org.AuthorisationServers ?? []).reduce(
            (n, s) => n + (s.ApiResources ?? []).length,
            0,
          )
          const seg = orgSegments(org)
          return (
            <Link key={org.OrganisationId} to={`/participantes/${org.OrganisationId}`}>
              <Card className="h-full p-4 transition hover:border-[var(--color-brand)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" title={org.OrganisationName}>
                      {org.OrganisationName}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {formatCnpj(org.RegistrationNumber)}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[var(--color-muted)]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <Badge key={r} tone="info">
                      {r}
                    </Badge>
                  ))}
                  <SegmentBadges pf={seg.pf} pj={seg.pj} emptyLabel={null} />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-[var(--color-muted)]">
                  <span>{serverCount} servers</span>
                  <span>{apiCount} APIs</span>
                </div>
                <div
                  className="mt-3 border-t border-[var(--color-border)] pt-2 font-mono text-[11px] text-[var(--color-muted)]"
                  title={`Organisation ID: ${org.OrganisationId}`}
                >
                  <span className="text-[var(--color-muted)]/70">ID </span>
                  {org.OrganisationId}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[var(--color-muted)]">
          Nenhuma organização encontrada.
        </div>
      )}
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm transition ${
        active
          ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  )
}
