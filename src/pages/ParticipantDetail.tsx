import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Building2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Server,
  Boxes,
  Radar,
} from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import {
  certHealth,
  formatCnpj,
  orgSegments,
  parseCertDate,
  isActive,
  prettyFamily,
  serverLabel,
  serverLifecycle,
  serverSegments,
  statusLabel,
} from '../lib/directory'
import {
  Badge,
  CertHealthBadge,
  CopyableId,
  IdTag,
  PageHeader,
  SegmentBadges,
} from '../components/shared'
import { groupApis, type GroupMode } from '../lib/taxonomy'
import type { ApiResource, AuthorisationServer, Organisation } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BorderBeam } from '@/components/ui/border-beam'
import { cn } from '@/lib/utils'

// Animação de abrir/fechar dos Collapsibles (keyframes do tw-animate-css).
const collapseAnim =
  'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'

export function ParticipantDetail() {
  const { id } = useParams<{ id: string }>()
  const { organisations } = useDirectory()
  const navigate = useNavigate()
  const org = organisations.find((o) => o.OrganisationId === id)
  const [groupBy, setGroupBy] = useState<GroupMode>('produto')
  // Servers expandidos (estado no pai para suportar "expandir/recolher todos").
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const location = useLocation()

  // "Voltar" sempre leva à lista de Participantes. Se viemos de um card da
  // lista, volta no histórico (preserva busca e filtros); se viemos da busca
  // rápida, da Vitrine ou de um link direto, abre a lista do zero.
  const goBack = () => {
    if ((location.state as { fromList?: boolean } | null)?.fromList) navigate(-1)
    else navigate('/participantes')
  }

  if (!org) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Organização não encontrada.{' '}
        <Link to="/participantes" className="text-primary">
          Voltar
        </Link>
      </div>
    )
  }

  const roles = [
    ...new Set((org.OrgDomainRoleClaims ?? []).map((r) => r.Role).filter(Boolean)),
  ] as string[]
  const seg = orgSegments(org)
  const servers = org.AuthorisationServers ?? []

  return (
    <>
      <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft /> Participantes
      </Button>

      <PageHeader title={org.OrganisationName} subtitle={org.LegalEntityName ?? undefined} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" /> Dados cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="text-sm">
              <InfoRow label="CNPJ" value={formatCnpj(org.RegistrationNumber)} />
              <InfoRow label="Status" value={statusLabel(org.Status)} />
              <InfoRow label="País" value={org.CountryOfRegistration ?? '—'} />
              <InfoRow label="Registro" value={org.RegistrationId ?? '—'} />
            </dl>
            {(org.AddressLine1 || org.City) && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {[org.AddressLine1, org.AddressLine2, org.City, org.Postcode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            <Separator />
            <Field label="Roles">
              {roles.length ? (
                roles.map((r) => (
                  <Badge key={r} tone="info">
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </Field>
            <Field label="Segmento">
              <SegmentBadges pf={seg.pf} pj={seg.pj} />
            </Field>
            <Field label="Organisation ID">
              <CopyableId id={org.OrganisationId} label="Organisation ID" />
            </Field>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <OrgSummary org={org} />
        </div>
      </div>

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">
          Authorisation Servers{' '}
          <span className="text-muted-foreground">({servers.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <ExpandAllButton org={org} openIds={openIds} setOpenIds={setOpenIds} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Agrupar APIs por</span>
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupMode)}>
              <TabsList>
                <TabsTrigger value="produto">Produto</TabsTrigger>
                <TabsTrigger value="fase">Fase</TabsTrigger>
                <TabsTrigger value="nenhum">Nenhum</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {servers.map((srv) => (
          <ServerCard
            key={srv.AuthorisationServerId}
            org={org}
            srv={srv}
            groupBy={groupBy}
            open={openIds.has(srv.AuthorisationServerId)}
            onOpenChange={(isOpen) =>
              setOpenIds((prev) => {
                const next = new Set(prev)
                if (isOpen) next.add(srv.AuthorisationServerId)
                else next.delete(srv.AuthorisationServerId)
                return next
              })
            }
          />
        ))}
      </div>
    </>
  )
}

function ExpandAllButton({
  org,
  openIds,
  setOpenIds,
}: {
  org: Organisation
  openIds: Set<string>
  setOpenIds: (ids: Set<string>) => void
}) {
  const allIds = (org.AuthorisationServers ?? []).map((s) => s.AuthorisationServerId)
  const allOpen = allIds.length > 0 && allIds.every((id) => openIds.has(id))

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpenIds(allOpen ? new Set() : new Set(allIds))}
    >
      {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
      {allOpen ? 'Recolher todos' : 'Expandir todos'}
    </Button>
  )
}

function OrgSummary({ org }: { org: Organisation }) {
  const { servers, apis, endpoints } = useMemo(() => {
    let apis = 0
    let endpoints = 0
    for (const s of org.AuthorisationServers ?? []) {
      apis += (s.ApiResources ?? []).length
      for (const a of s.ApiResources ?? []) endpoints += (a.ApiDiscoveryEndpoints ?? []).length
    }
    return { servers: (org.AuthorisationServers ?? []).length, apis, endpoints }
  }, [org])

  const stats = [
    { label: 'Authorisation Servers', value: servers, icon: Server, accent: 'text-info' },
    { label: 'APIs declaradas', value: apis, icon: Boxes, accent: 'text-foreground' },
    { label: 'Endpoints de descoberta', value: endpoints, icon: Radar, accent: 'text-foreground' },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, accent }, i) => (
        <Card key={label} className="relative">
          <CardContent>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">{label}</span>
              <Icon className="size-4" />
            </div>
            {/* NumberTicker (Magic UI): conta de 0 até o valor. */}
            <NumberTicker
              value={value}
              className={cn('mt-2 block font-heading text-3xl font-semibold tracking-tight', accent)}
            />
          </CardContent>
          {/* BorderBeam (Magic UI): feixe de luz percorrendo a borda do 1º card. */}
          {i === 0 && <BorderBeam size={80} duration={8} colorFrom="#2ecc9b" colorTo="#3aa0ff" />}
        </Card>
      ))}
    </div>
  )
}

function ServerCard({
  org,
  srv,
  groupBy,
  open,
  onOpenChange,
}: {
  org: Organisation
  srv: AuthorisationServer
  groupBy: GroupMode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const apis = srv.ApiResources ?? []
  const certs = srv.AuthorisationServerCertifications ?? []
  const seg = serverSegments(srv)
  const lifecycle = serverLifecycle(srv)
  const groups = useMemo(
    () => groupApis(srv.ApiResources ?? [], groupBy),
    [srv.ApiResources, groupBy],
  )
  const name = serverLabel(org, srv.CustomerFriendlyName)

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <Card className="gap-0 py-0">
        {/* Cabeçalho: gatilho esticado (expande/recolhe) por baixo; IdTag e
            badges ficam por cima para o IdTag copiar e os badges mostrarem o tooltip. */}
        <div className="relative flex w-full flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-label={`${name} — ${open ? 'recolher' : 'expandir'} detalhes`}
              className="absolute inset-0 rounded-t-xl"
            />
          </CollapsibleTrigger>
          {srv.CustomerFriendlyLogoUri ? (
            <img
              src={srv.CustomerFriendlyLogoUri}
              alt=""
              className="size-9 rounded-md bg-white/5 object-contain p-0.5"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="size-9 rounded-md bg-secondary" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {srv.Issuer ?? 'sem issuer'}
            </div>
            <div className="mt-1">
              <IdTag id={srv.AuthorisationServerId} label="Authorisation Server ID" />
            </div>
          </div>
          <div
            onClick={() => onOpenChange(!open)}
            className="relative z-10 flex basis-full cursor-pointer flex-wrap items-center gap-1.5 sm:basis-auto sm:justify-end"
          >
            <Badge
              tone={isActive(srv.Status) ? 'ok' : 'neutral'}
              title={`Status no diretório: ${statusLabel(srv.Status)}`}
            >
              {statusLabel(srv.Status)}
            </Badge>
            {lifecycle.map((b) => (
              <Badge key={b.label} tone={b.tone} title={b.title}>
                {b.label}
              </Badge>
            ))}
            <SegmentBadges pf={seg.pf} pj={seg.pj} emptyLabel={null} />
            <Badge tone="neutral">{apis.length} APIs</Badge>
            {srv.SupportsRedirect && <Badge tone="neutral">Redirect</Badge>}
            {srv.SupportsDCR && <Badge tone="neutral">DCR</Badge>}
            {srv.SupportsCiba && <Badge tone="neutral">CIBA</Badge>}
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
            />
          </div>
        </div>

        <CollapsibleContent className={collapseAnim}>
          <div className="flex flex-col gap-5 border-t px-4 py-4">
            {/* Identificação + links */}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Field label="Authorisation Server ID">
                <CopyableId id={srv.AuthorisationServerId} label="Authorisation Server ID" />
              </Field>
              <div className="flex flex-wrap gap-2">
                {srv.OpenIDDiscoveryDocument && (
                  <LinkButton href={srv.OpenIDDiscoveryDocument}>OIDC Discovery</LinkButton>
                )}
                {srv.DeveloperPortalUri && (
                  <LinkButton href={srv.DeveloperPortalUri}>Portal do Dev</LinkButton>
                )}
                {srv.TermsOfServiceUri && (
                  <LinkButton href={srv.TermsOfServiceUri}>Termos de Uso</LinkButton>
                )}
              </div>
            </div>

            {/* Ciclo de vida (descontinuação / aposentadoria) */}
            {lifecycle.length > 0 && (
              <Field label="Ciclo de vida" vertical>
                {lifecycle.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm">
                    <Badge tone={b.tone}>{b.label}</Badge>
                    <span className="text-muted-foreground">{b.title}</span>
                  </div>
                ))}
              </Field>
            )}

            {/* Certificações */}
            {certs.length > 0 && (
              <Field label="Certificações do server" vertical>
                {certs.map((c) => {
                  const exp = parseCertDate(c.CertificationExpirationDate)
                  return (
                    <div
                      key={c.CertificationId}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                    >
                      <CertHealthBadge health={certHealth(exp)} />
                      <span className="text-muted-foreground">
                        {c.ProfileVariant ?? c.ProfileType ?? '—'}
                      </span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {c.CertificationStartDate} → {c.CertificationExpirationDate}
                      </span>
                    </div>
                  )
                })}
              </Field>
            )}

            {/* APIs agrupadas por produto/fase */}
            <div className="flex flex-col gap-4">
              <div className="text-xs font-medium text-muted-foreground">APIs ({apis.length})</div>
              {groups.map((group) => (
                <div key={group.key}>
                  {group.label && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium">{group.label}</span>
                      <Badge tone="neutral">{group.apis.length}</Badge>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {group.apis.map((api) => (
                      <ApiCard key={api.ApiResourceId} api={api} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function ApiCard({ api }: { api: ApiResource }) {
  const endpoints = api.ApiDiscoveryEndpoints ?? []
  return (
    <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{prettyFamily(api.ApiFamilyType)}</span>
        <Badge tone={api.Status === 'Active' ? 'ok' : 'neutral'}>v{api.ApiVersion}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {api.CertificationStatus ?? 'sem certificação'}
        {api.FamilyComplete ? ' · família completa' : ''}
      </div>
      {endpoints.length > 0 && (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="group inline-flex items-center gap-1 text-xs text-info hover:underline">
            {endpoints.length} endpoints
            <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className={collapseAnim}>
            <ul className="mt-1 space-y-1">
              {endpoints.map((e) => (
                <li key={e.ApiDiscoveryId}>
                  <a
                    href={e.ApiEndpoint}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] break-all text-muted-foreground hover:text-info"
                  >
                    {e.ApiEndpoint}
                  </a>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function Field({
  label,
  vertical = false,
  children,
}: {
  label: string
  vertical?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <div className={vertical ? 'flex flex-col gap-1' : 'flex flex-wrap gap-1'}>{children}</div>
    </div>
  )
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button variant="outline" size="xs" asChild>
      <a href={href} target="_blank" rel="noreferrer">
        {children} <ExternalLink />
      </a>
    </Button>
  )
}
