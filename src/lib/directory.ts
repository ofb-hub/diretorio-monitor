import type {
  ApiRow,
  AuthorisationServer,
  CertHealth,
  CertRow,
  DirectorySnapshot,
  DirectoryStats,
  Organisation,
} from '../types'

export const DIRECTORY_URL =
  'https://data.directory.openbankingbrasil.org.br/participants'

const CACHE_KEY = 'ofbr-directory-snapshot-v1'
// Servidor entrega Cache-Control max-age=900 (15 min). Espelhamos localmente.
const CACHE_TTL_MS = 15 * 60 * 1000

const EXPIRING_WINDOW_DAYS = 90

// ---- Cache em localStorage ----

function readCache(): DirectorySnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DirectorySnapshot
  } catch {
    return null
  }
}

function writeCache(snap: DirectorySnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snap))
  } catch {
    // storage cheio ou indisponível — ignora, seguimos em memória
  }
}

export interface FetchResult {
  snapshot: DirectorySnapshot
  fromCache: boolean
}

/**
 * Busca os participantes do diretório. Usa cache local quando fresco.
 * `force` ignora o cache e vai à rede.
 */
export async function fetchDirectory(force = false): Promise<FetchResult> {
  const cached = readCache()
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS

  if (!force && fresh && cached) {
    return { snapshot: cached, fromCache: true }
  }

  try {
    const res = await fetch(DIRECTORY_URL, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const organisations = (await res.json()) as Organisation[]
    const snapshot: DirectorySnapshot = { organisations, fetchedAt: Date.now() }
    writeCache(snapshot)
    return { snapshot, fromCache: false }
  } catch (err) {
    // Rede falhou: se temos qualquer cache (mesmo velho), usamos como fallback.
    if (cached) return { snapshot: cached, fromCache: true }
    throw err
  }
}

// ---- Datas de certificação (formato dd/MM/yyyy) ----

export function parseCertDate(value: string | null): Date | null {
  if (!value) return null
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  const [, dd, mm, yyyy] = m
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return isNaN(d.getTime()) ? null : d
}

export function certHealth(exp: Date | null, now = new Date()): CertHealth {
  if (!exp) return 'unknown'
  const days = daysBetween(now, exp)
  if (days < 0) return 'expired'
  if (days <= EXPIRING_WINDOW_DAYS) return 'expiring'
  return 'ok'
}

function daysBetween(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((db - da) / MS)
}

// ---- Normalizações ----

export function serverLabel(
  org: Organisation,
  serverName: string | null | undefined,
): string {
  return serverName?.trim() || org.OrganisationName
}

// ---- Segmentos PF/PJ ----
// A informação de segmento vem das Flags do Authorisation Server:
// "Suporta Contas PF" e "Suporta Contas PJ". Nem todos os servers a declaram.
const FLAG_PF = 'Suporta Contas PF'
const FLAG_PJ = 'Suporta Contas PJ'

export interface Segments {
  pf: boolean
  pj: boolean
}

export function serverSegments(srv: AuthorisationServer): Segments {
  const flags = srv.Flags ?? {}
  return { pf: FLAG_PF in flags, pj: FLAG_PJ in flags }
}

/** Segmentos consolidados da organização (união dos seus servers). */
export function orgSegments(org: Organisation): Segments {
  let pf = false
  let pj = false
  for (const srv of org.AuthorisationServers ?? []) {
    const s = serverSegments(srv)
    pf = pf || s.pf
    pj = pj || s.pj
  }
  return { pf, pj }
}

/** Achata todas as certificações de authorisation servers em linhas. */
export function flattenCerts(orgs: Organisation[]): CertRow[] {
  const now = new Date()
  const rows: CertRow[] = []
  for (const org of orgs) {
    for (const srv of org.AuthorisationServers ?? []) {
      for (const cert of srv.AuthorisationServerCertifications ?? []) {
        const exp = parseCertDate(cert.CertificationExpirationDate)
        rows.push({
          organisationId: org.OrganisationId,
          organisationName: org.OrganisationName,
          authorisationServerId: srv.AuthorisationServerId,
          serverName: serverLabel(org, srv.CustomerFriendlyName),
          certificationId: cert.CertificationId,
          profileVariant: cert.ProfileVariant,
          profileType: cert.ProfileType,
          status: cert.CertificationStatus,
          startDate: cert.CertificationStartDate,
          expirationDate: cert.CertificationExpirationDate,
          expirationDateObj: exp,
          daysToExpire: exp ? daysBetween(now, exp) : null,
          health: certHealth(exp, now),
        })
      }
    }
  }
  return rows
}

/** Achata todos os ApiResources em linhas. */
export function flattenApis(orgs: Organisation[]): ApiRow[] {
  const rows: ApiRow[] = []
  for (const org of orgs) {
    for (const srv of org.AuthorisationServers ?? []) {
      for (const api of srv.ApiResources ?? []) {
        rows.push({
          organisationId: org.OrganisationId,
          organisationName: org.OrganisationName,
          authorisationServerId: srv.AuthorisationServerId,
          serverName: serverLabel(org, srv.CustomerFriendlyName),
          apiResourceId: api.ApiResourceId,
          familyType: api.ApiFamilyType,
          version: api.ApiVersion,
          status: api.Status,
          certificationStatus: api.CertificationStatus,
          familyComplete: api.FamilyComplete,
          endpointCount: (api.ApiDiscoveryEndpoints ?? []).length,
        })
      }
    }
  }
  return rows
}

// ---- Estatísticas agregadas ----

export function computeStats(orgs: Organisation[]): DirectoryStats {
  const certRows = flattenCerts(orgs)
  const apiRows = flattenApis(orgs)

  const famMap = new Map<string, number>()
  const certStatusMap = new Map<string, number>()
  for (const a of apiRows) {
    famMap.set(a.familyType, (famMap.get(a.familyType) ?? 0) + 1)
    const cs = a.certificationStatus ?? 'Sem status'
    certStatusMap.set(cs, (certStatusMap.get(cs) ?? 0) + 1)
  }

  const roleMap = new Map<string, number>()
  for (const org of orgs) {
    for (const rc of org.OrgDomainRoleClaims ?? []) {
      const r = rc.Role ?? '—'
      roleMap.set(r, (roleMap.get(r) ?? 0) + 1)
    }
  }

  let totalServers = 0
  let orgsPf = 0
  let orgsPj = 0
  for (const org of orgs) {
    totalServers += (org.AuthorisationServers ?? []).length
    const seg = orgSegments(org)
    if (seg.pf) orgsPf++
    if (seg.pj) orgsPj++
  }

  return {
    totalOrganisations: orgs.length,
    activeOrganisations: orgs.filter((o) => o.Status === 'Active').length,
    totalServers,
    totalApis: apiRows.length,
    orgsPf,
    orgsPj,
    certsOk: certRows.filter((c) => c.health === 'ok').length,
    certsExpiring: certRows.filter((c) => c.health === 'expiring').length,
    certsExpired: certRows.filter((c) => c.health === 'expired').length,
    apiFamilyCounts: mapToSorted(famMap),
    roleCounts: mapToSorted(roleMap),
    certStatusCounts: mapToSorted(certStatusMap),
  }
}

function mapToSorted(m: Map<string, number>): { name: string; value: number }[] {
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

// ---- Helpers de apresentação ----

export function formatCnpj(v: string | null | undefined): string {
  if (!v) return '—'
  const d = v.replace(/\D/g, '')
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-BR')
}

/** Rótulo amigável para famílias de API (ex.: payments-pix -> Payments · Pix). */
export function prettyFamily(familyType: string): string {
  return familyType
    .split('_')
    .map((seg) =>
      seg
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    )
    .join(' · ')
}
