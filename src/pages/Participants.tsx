import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronRight, X, Server, Boxes } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatCnpj, isActive, orgSegments, statusLabel } from '../lib/directory'
import { matchOrganisation } from '../lib/search'
import { Badge, IdTag, PageHeader, SegmentBadges } from '../components/shared'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MagicCard } from '@/components/ui/magic-card'
import { BlurFade } from '@/components/ui/blur-fade'

type SegmentFilter = 'pf' | 'pj' | 'sem'

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

  const segmentValue: SegmentFilter[] = [
    ...(pf ? (['pf'] as const) : []),
    ...(pj ? (['pj'] as const) : []),
    ...(noSegment ? (['sem'] as const) : []),
  ]

  // "Sem segmento" é exclusivo com PF/PJ: o que acabou de ser marcado vence.
  const onSegmentChange = (values: string[]) => {
    const added = values.find((v) => !segmentValue.includes(v as SegmentFilter))
    if (added === 'sem') {
      updateParams({ sem: '1', pf: null, pj: null })
      return
    }
    updateParams({
      pf: values.includes('pf') ? '1' : null,
      pj: values.includes('pj') ? '1' : null,
      sem: added ? null : values.includes('sem') ? '1' : null,
    })
  }

  const filtered = useMemo(() => {
    return organisations
      .filter((org) => {
        if (noSegment) {
          const seg = orgSegments(org)
          return !seg.pf && !seg.pj
        }
        if (pf || pj) {
          // Correspondência exata: a seleção define exatamente quais segmentos
          // a org deve ter. PF só -> PF e não PJ; ambos -> exatamente os dois.
          const seg = orgSegments(org)
          return seg.pf === pf && seg.pj === pj
        }
        return true
      })
      .map((org) => ({ org, match: matchOrganisation(org, query) }))
      .filter(({ match }) => match.hit)
      .sort((a, b) => a.org.OrganisationName.localeCompare(b.org.OrganisationName))
  }, [organisations, query, pf, pj, noSegment])

  return (
    <>
      <PageHeader
        title="Participantes"
        subtitle={`${filtered.length} de ${organisations.length} organizações`}
      />

      {/* Barra de busca/filtros fixa ao rolar */}
      <div className="sticky top-0 z-10 -mx-2 mb-4 flex flex-wrap items-center gap-3 bg-background/80 px-2 py-3 backdrop-blur-md">
        <InputGroup className="min-w-64 flex-1 bg-card">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="Buscar por nome, marca, CNPJ ou ID (org/server)…"
            aria-label="Buscar participantes"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Limpar busca"
                onClick={() => updateParams({ q: null })}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={segmentValue}
          onValueChange={onSegmentChange}
          aria-label="Filtrar por segmento"
        >
          <ToggleGroupItem value="pf" className="data-[state=on]:bg-ok/15 data-[state=on]:text-ok">
            PF
          </ToggleGroupItem>
          <ToggleGroupItem value="pj" className="data-[state=on]:bg-warn/15 data-[state=on]:text-warn">
            PJ
          </ToggleGroupItem>
          <ToggleGroupItem value="sem">Sem segmento</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ org, match }, i) => {
          const servers = org.AuthorisationServers ?? []
          const apiCount = servers.reduce((n, s) => n + (s.ApiResources ?? []).length, 0)
          const seg = orgSegments(org)
          const { matchedBrands } = match
          return (
            // BlurFade (Magic UI): entrada suave em cascata, só nos primeiros cards.
            <BlurFade key={org.OrganisationId} delay={Math.min(i, 12) * 0.03} inView>
              {/* MagicCard (Magic UI): borda com gradiente que segue o mouse. */}
              <MagicCard
                className="h-full rounded-xl"
                gradientFrom="#2ecc9b"
                gradientTo="#3aa0ff"
                gradientColor="#1b2440"
                gradientSize={240}
              >
                <div className="relative flex h-full flex-col p-4">
                  {/* Link esticado sobre o card inteiro; o IdTag fica por cima dele. */}
                  <Link
                    to={`/participantes/${org.OrganisationId}`}
                    // Marca que viemos da lista: o "voltar" do detalhe usa o
                    // histórico e preserva busca/filtros.
                    state={{ fromList: true }}
                    aria-label={org.OrganisationName}
                    className="absolute inset-0 rounded-xl"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium" title={org.OrganisationName}>
                        {org.OrganisationName}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {formatCnpj(org.RegistrationNumber)}
                      </div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge tone={isActive(org.Status) ? 'ok' : 'neutral'}>
                      {statusLabel(org.Status)}
                    </Badge>
                    <SegmentBadges pf={seg.pf} pj={seg.pj} emptyLabel={null} />
                  </div>
                  {matchedBrands.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      <span>Marca:</span>
                      {matchedBrands.slice(0, 3).map((b) => (
                        <Badge key={b} tone="info">
                          {b}
                        </Badge>
                      ))}
                      {matchedBrands.length > 3 && <span>+{matchedBrands.length - 3}</span>}
                    </div>
                  )}
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Server size={12} /> {servers.length} servers
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Boxes size={12} /> {apiCount} APIs
                    </span>
                  </div>
                  {/* Empurra o ID para o rodapé em cards de alturas diferentes. */}
                  <div className="flex-1" />
                  <div className="mt-3 border-t pt-3">
                    <IdTag id={org.OrganisationId} label="Organisation ID" className="w-full" />
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          Nenhuma organização encontrada.
        </div>
      )}
    </>
  )
}
