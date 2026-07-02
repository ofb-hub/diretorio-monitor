import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronRight, X } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatCnpj, isActive, orgSegments, statusLabel } from '../lib/directory'
import { Badge, Card, IdTag, PageHeader, SegmentBadges } from '../components/ui'

export function Participants() {
  const { organisations } = useDirectory()

  // Busca e filtros vivem na URL (?q=...&pf=1&pj=1&sem=1):
  // voltar do detalhe preserva o estado e a visão filtrada é compartilhável.
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const pf = searchParams.get('pf') === '1'
  const pj = searchParams.get('pj') === '1'
  const noSegment = searchParams.get('sem') === '1'

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === null || v === '') next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true },
    )
  }

  // Handlers garantem exclusividade entre "Sem segmento" e PF/PJ.
  const togglePf = () => updateParams({ pf: pf ? null : '1', sem: null })
  const togglePj = () => updateParams({ pj: pj ? null : '1', sem: null })
  const toggleNoSegment = () =>
    updateParams({ sem: noSegment ? null : '1', pf: null, pj: null })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return organisations
      .filter((org) => {
        if (noSegment) {
          const seg = orgSegments(org)
          if (seg.pf || seg.pj) return false
        } else if (pf || pj) {
          // Correspondência exata: a seleção define exatamente quais segmentos
          // a org deve ter. PF só -> PF e não PJ; ambos -> exatamente os dois.
          const seg = orgSegments(org)
          if (seg.pf !== pf || seg.pj !== pj) return false
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
  }, [organisations, query, pf, pj, noSegment])

  return (
    <>
      <PageHeader
        title="Participantes"
        subtitle={`${filtered.length} de ${organisations.length} organizações`}
      />

      {/* Barra de busca/filtros fixa ao rolar */}
      <div className="sticky top-0 z-10 -mx-2 mb-4 flex flex-wrap items-center gap-3 bg-[var(--color-bg)]/95 px-2 py-3 backdrop-blur">
        <div className="relative flex-1 min-w-64">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            value={query}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="Buscar por nome, CNPJ ou ID (org/server)…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-8 pl-9 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {query && (
            <button
              onClick={() => updateParams({ q: null })}
              aria-label="Limpar busca"
              title="Limpar busca"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          <FilterChip active={pf} onClick={togglePf}>
            PF
          </FilterChip>
          <FilterChip active={pj} onClick={togglePj}>
            PJ
          </FilterChip>
          <FilterChip active={noSegment} onClick={toggleNoSegment}>
            Sem segmento
          </FilterChip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((org) => {
          const serverCount = (org.AuthorisationServers ?? []).length
          const apiCount = (org.AuthorisationServers ?? []).reduce(
            (n, s) => n + (s.ApiResources ?? []).length,
            0,
          )
          const seg = orgSegments(org)
          return (
            <Link key={org.OrganisationId} to={`/participantes/${org.OrganisationId}`}>
              <Card className="h-full p-4 transition duration-150 hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-lg hover:shadow-black/20">
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
                  <Badge
                    tone={isActive(org.Status) ? 'ok' : 'neutral'}
                    title={`Status no diretório: ${statusLabel(org.Status)}`}
                  >
                    {statusLabel(org.Status)}
                  </Badge>
                  <SegmentBadges pf={seg.pf} pj={seg.pj} emptyLabel={null} />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-[var(--color-muted)]">
                  <span>{serverCount} servers</span>
                  <span>{apiCount} APIs</span>
                </div>
                <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                  <IdTag id={org.OrganisationId} className="w-full" />
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
