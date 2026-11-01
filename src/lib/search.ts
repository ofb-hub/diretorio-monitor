import type { Organisation } from '../types'

/** Minúsculas e sem acentos: "Crédito" e "credito" passam a ser iguais. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Busca só conta como CNPJ quando é numérica (com ou sem pontuação).
// Sem isso, qualquer dígito no meio de um texto ("banco 2", um trecho de UUID)
// casava com dezenas de CNPJs.
const CNPJ_QUERY = /^[\d.\-/\s]+$/
const CNPJ_MIN_DIGITS = 3

export interface OrgMatch {
  hit: boolean
  /** Marcas (nomes de Authorisation Server) que justificam o match quando o nome da org não casa. */
  matchedBrands: string[]
}

/**
 * Testa uma organização contra a busca: nome/razão social, marca,
 * CNPJ (só para busca numérica) e IDs de org/server.
 */
export function matchOrganisation(org: Organisation, query: string): OrgMatch {
  const q = normalizeText(query.trim())
  if (!q) return { hit: true, matchedBrands: [] }

  const servers = org.AuthorisationServers ?? []

  const nameHit =
    normalizeText(org.OrganisationName).includes(q) ||
    normalizeText(org.LegalEntityName).includes(q)

  const qDigits = q.replace(/\D/g, '')
  const cnpjHit =
    CNPJ_QUERY.test(q) &&
    qDigits.length >= CNPJ_MIN_DIGITS &&
    (org.RegistrationNumber ?? '').replace(/\D/g, '').includes(qDigits)

  const idHit =
    org.OrganisationId.toLowerCase().includes(q) ||
    servers.some((s) => s.AuthorisationServerId.toLowerCase().includes(q))

  // Busca transitiva por marca: o nome de um Authorisation Server
  // (ex.: "BV") encontra a organização dona dele.
  const matchedBrands = [
    ...new Set(
      servers
        .map((s) => s.CustomerFriendlyName)
        .filter((n): n is string => !!n && normalizeText(n).includes(q)),
    ),
  ]

  return {
    hit: nameHit || cnpjHit || idHit || matchedBrands.length > 0,
    // Só exibe as marcas quando o nome da org não explica o match —
    // senão a org aparece na busca sem motivo visível.
    matchedBrands: nameHit ? [] : matchedBrands,
  }
}
