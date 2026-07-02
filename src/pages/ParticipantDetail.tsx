import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Building2, ChevronDown } from 'lucide-react'
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
  Card,
  CertHealthBadge,
  CopyableId,
  PageHeader,
  SegmentBadges,
} from '../components/ui'
import { groupApis, type GroupMode } from '../lib/taxonomy'
import type { ApiResource, AuthorisationServer, Organisation } from '../types'

export function ParticipantDetail() {
  const { id } = useParams<{ id: string }>()
  const { organisations } = useDirectory()
  const org = organisations.find((o) => o.OrganisationId === id)
  const [groupBy, setGroupBy] = useState<GroupMode>('produto')

  if (!org) {
    return (
      <div className="py-16 text-center text-[var(--color-muted)]">
        Organização não encontrada.{' '}
        <Link to="/participantes" className="text-[var(--color-brand)]">
          Voltar
        </Link>
      </div>
    )
  }

  const roles = [
    ...new Set((org.OrgDomainRoleClaims ?? []).map((r) => r.Role).filter(Boolean)),
  ] as string[]
  const seg = orgSegments(org)

  return (
    <>
      <Link
        to="/participantes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={16} /> Participantes
      </Link>

      <PageHeader title={org.OrganisationName} subtitle={org.LegalEntityName ?? undefined} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Building2 size={18} /> Dados cadastrais
          </h2>
          <InfoRow label="CNPJ" value={formatCnpj(org.RegistrationNumber)} />
          <InfoRow label="Status" value={org.Status} />
          <InfoRow label="País" value={org.CountryOfRegistration ?? '—'} />
          <InfoRow label="Registro" value={org.RegistrationId ?? '—'} />
          {(org.AddressLine1 || org.City) && (
            <div className="mt-3 flex items-start gap-2 text-sm text-[var(--color-muted)]">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>
                {[org.AddressLine1, org.AddressLine2, org.City, org.Postcode]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          <div className="mt-4">
            <div className="mb-1 text-xs text-[var(--color-muted)]">Roles</div>
            <div className="flex flex-wrap gap-1">
              {roles.length ? (
                roles.map((r) => (
                  <Badge key={r} tone="info">
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-[var(--color-muted)]">—</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs text-[var(--color-muted)]">Segmento</div>
            <div className="flex flex-wrap gap-1">
              <SegmentBadges pf={seg.pf} pj={seg.pj} />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 text-xs text-[var(--color-muted)]">Organisation ID</div>
            <CopyableId id={org.OrganisationId} label="Organisation ID" />
          </div>
        </Card>

        <div className="lg:col-span-2">
          <OrgSummary org={org} />
        </div>
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          Authorisation Servers ({(org.AuthorisationServers ?? []).length})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">Agrupar APIs por</span>
          <div className="flex gap-1">
            {(
              [
                ['produto', 'Produto'],
                ['fase', 'Fase'],
                ['nenhum', 'Nenhum'],
              ] as [GroupMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setGroupBy(mode)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  groupBy === mode
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {(org.AuthorisationServers ?? []).map((srv) => (
          <ServerCard key={srv.AuthorisationServerId} org={org} srv={srv} groupBy={groupBy} />
        ))}
      </div>
    </>
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

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-4">
        <div className="text-2xl font-bold text-[var(--color-brand-2)]">{servers}</div>
        <div className="text-xs text-[var(--color-muted)]">Authorisation Servers</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold">{apis}</div>
        <div className="text-xs text-[var(--color-muted)]">APIs declaradas</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold">{endpoints}</div>
        <div className="text-xs text-[var(--color-muted)]">Endpoints de descoberta</div>
      </Card>
    </div>
  )
}

function ServerCard({
  org,
  srv,
  groupBy,
}: {
  org: Organisation
  srv: AuthorisationServer
  groupBy: GroupMode
}) {
  const [open, setOpen] = useState(false)
  const apis = srv.ApiResources ?? []
  const certs = srv.AuthorisationServerCertifications ?? []
  const seg = serverSegments(srv)
  const lifecycle = serverLifecycle(srv)
  const groups = useMemo(() => groupApis(apis, groupBy), [apis, groupBy])

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-2)]"
      >
        {srv.CustomerFriendlyLogoUri ? (
          <img
            src={srv.CustomerFriendlyLogoUri}
            alt=""
            className="h-8 w-8 rounded object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="h-8 w-8 rounded bg-[var(--color-surface-2)]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{serverLabel(org, srv.CustomerFriendlyName)}</div>
          <div className="truncate text-xs text-[var(--color-muted)]">
            {srv.Issuer ?? 'sem issuer'}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
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
            size={18}
            className={`text-[var(--color-muted)] transition ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] px-4 py-4">
          {/* Identificação do server */}
          <div className="mb-4">
            <div className="mb-1 text-xs text-[var(--color-muted)]">
              Authorisation Server ID
            </div>
            <CopyableId id={srv.AuthorisationServerId} label="Authorisation Server ID" />
          </div>

          {/* Ciclo de vida (descontinuação / aposentadoria) */}
          {lifecycle.length > 0 && (
            <div className="mb-4">
              <div className="mb-1 text-xs text-[var(--color-muted)]">Ciclo de vida</div>
              <div className="flex flex-col gap-1">
                {lifecycle.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm">
                    <Badge tone={b.tone}>{b.label}</Badge>
                    <span className="text-[var(--color-muted)]">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links do server */}
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {srv.OpenIDDiscoveryDocument && (
              <LinkPill href={srv.OpenIDDiscoveryDocument}>OIDC Discovery</LinkPill>
            )}
            {srv.DeveloperPortalUri && (
              <LinkPill href={srv.DeveloperPortalUri}>Portal do Dev</LinkPill>
            )}
            {srv.TermsOfServiceUri && (
              <LinkPill href={srv.TermsOfServiceUri}>Termos de Uso</LinkPill>
            )}
          </div>

          {/* Certificações */}
          {certs.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold text-[var(--color-muted)]">
                Certificações do server
              </div>
              <div className="flex flex-col gap-1">
                {certs.map((c) => {
                  const exp = parseCertDate(c.CertificationExpirationDate)
                  return (
                    <div
                      key={c.CertificationId}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm"
                    >
                      <CertHealthBadge health={certHealth(exp)} />
                      <span className="text-[var(--color-muted)]">
                        {c.ProfileVariant ?? c.ProfileType ?? '—'}
                      </span>
                      <span className="ml-auto text-xs text-[var(--color-muted)]">
                        {c.CertificationStartDate} → {c.CertificationExpirationDate}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* APIs agrupadas por produto/fase */}
          <div className="text-xs font-semibold text-[var(--color-muted)]">
            APIs ({apis.length})
          </div>
          <div className="mt-2 flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {group.label}
                    </span>
                    <Badge tone="neutral">{group.apis.length}</Badge>
                    <div className="h-px flex-1 bg-[var(--color-border)]" />
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
      )}
    </Card>
  )
}

function ApiCard({ api }: { api: ApiResource }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{prettyFamily(api.ApiFamilyType)}</span>
        <Badge tone={api.Status === 'Active' ? 'ok' : 'neutral'}>v{api.ApiVersion}</Badge>
      </div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">
        {api.CertificationStatus ?? 'sem certificação'}
        {api.FamilyComplete ? ' · família completa' : ''}
      </div>
      {(api.ApiDiscoveryEndpoints ?? []).length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-[var(--color-brand-2)]">
            {api.ApiDiscoveryEndpoints.length} endpoints
          </summary>
          <ul className="mt-1 space-y-1">
            {api.ApiDiscoveryEndpoints.map((e) => (
              <li key={e.ApiDiscoveryId}>
                <a
                  href={e.ApiEndpoint}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-xs text-[var(--color-muted)] hover:text-[var(--color-brand-2)]"
                >
                  {e.ApiEndpoint}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--color-border)] py-1.5 text-sm last:border-0">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 hover:border-[var(--color-brand-2)] hover:text-[var(--color-brand-2)]"
    >
      {children} <ExternalLink size={12} />
    </a>
  )
}
