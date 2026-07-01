// Taxonomia das famílias de API do Open Finance Brasil.
// Cada ApiFamilyType é classificado em uma FASE (jornada regulatória) e em um
// PRODUTO (domínio funcional). Mapeamento validado contra as 57 famílias
// presentes no diretório.

import type { ApiResource } from '../types'

export type PhaseKey = 'fase1' | 'fase2' | 'fase3' | 'fase4' | 'operacional' | 'outros'
export type ProductKey =
  | 'clientes'
  | 'contas'
  | 'cartoes'
  | 'credito'
  | 'investimentos'
  | 'cambio'
  | 'seguros'
  | 'credenciamento'
  | 'canais'
  | 'pagamentos'
  | 'consentimento'
  | 'operacional'
  | 'outros'

interface PhaseMeta {
  label: string
  short: string
  order: number
}
interface ProductMeta {
  label: string
  order: number
}

export const PHASES: Record<PhaseKey, PhaseMeta> = {
  fase1: { label: 'Fase 1 · Dados Abertos', short: 'Fase 1', order: 1 },
  fase2: { label: 'Fase 2 · Dados de Clientes', short: 'Fase 2', order: 2 },
  fase3: { label: 'Fase 3 · Iniciação de Pagamento', short: 'Fase 3', order: 3 },
  fase4: { label: 'Fase 4 · Novos Dados & Serviços', short: 'Fase 4', order: 4 },
  operacional: { label: 'Operacional', short: 'Operacional', order: 5 },
  outros: { label: 'Outros', short: 'Outros', order: 99 },
}

export const PRODUCTS: Record<ProductKey, ProductMeta> = {
  clientes: { label: 'Cadastro & Clientes', order: 1 },
  contas: { label: 'Contas', order: 2 },
  cartoes: { label: 'Cartões de Crédito', order: 3 },
  credito: { label: 'Operações de Crédito', order: 4 },
  investimentos: { label: 'Investimentos', order: 5 },
  cambio: { label: 'Câmbio', order: 6 },
  seguros: { label: 'Seguros, Previdência & Capitalização', order: 7 },
  credenciamento: { label: 'Credenciamento (Acquiring)', order: 8 },
  canais: { label: 'Canais de Atendimento', order: 9 },
  pagamentos: { label: 'Pagamentos', order: 10 },
  consentimento: { label: 'Consentimento & Recursos', order: 11 },
  operacional: { label: 'Operacional', order: 12 },
  outros: { label: 'Outros', order: 99 },
}

interface FamilyClass {
  phase: PhaseKey
  product: ProductKey
}

// Mapeamento explícito das famílias transacionais e operacionais.
const EXPLICIT: Record<string, FamilyClass> = {
  // Operacional
  admin: { phase: 'operacional', product: 'operacional' },
  discovery_status: { phase: 'operacional', product: 'operacional' },
  discovery_outages: { phase: 'operacional', product: 'operacional' },

  // Fase 2 — dados de clientes
  consents: { phase: 'fase2', product: 'consentimento' },
  resources: { phase: 'fase2', product: 'consentimento' },
  'customers-personal': { phase: 'fase2', product: 'clientes' },
  'customers-business': { phase: 'fase2', product: 'clientes' },
  accounts: { phase: 'fase2', product: 'contas' },
  'credit-cards-accounts': { phase: 'fase2', product: 'cartoes' },
  loans: { phase: 'fase2', product: 'credito' },
  financings: { phase: 'fase2', product: 'credito' },
  'invoice-financings': { phase: 'fase2', product: 'credito' },
  'unarranged-accounts-overdraft': { phase: 'fase2', product: 'credito' },

  // Fase 3 — iniciação de pagamento
  'payments-consents': { phase: 'fase3', product: 'pagamentos' },
  'payments-pix': { phase: 'fase3', product: 'pagamentos' },
  'payments-recurring-consents': { phase: 'fase3', product: 'pagamentos' },
  'payments-pix-recurring-payments': { phase: 'fase3', product: 'pagamentos' },
  'payments-recurring-consents-automatic': { phase: 'fase3', product: 'pagamentos' },
  'payments-pix-recurring-payments-automatic': { phase: 'fase3', product: 'pagamentos' },
  enrollments: { phase: 'fase3', product: 'pagamentos' },

  // Fase 4 — novos dados & serviços
  'bank-fixed-incomes': { phase: 'fase4', product: 'investimentos' },
  'credit-fixed-incomes': { phase: 'fase4', product: 'investimentos' },
  funds: { phase: 'fase4', product: 'investimentos' },
  'treasure-titles': { phase: 'fase4', product: 'investimentos' },
  'variable-incomes': { phase: 'fase4', product: 'investimentos' },
  exchanges: { phase: 'fase4', product: 'cambio' },
  'credit-portability': { phase: 'fase4', product: 'credito' },
}

// Famílias de dados abertos (prefixo opendata-*): sempre Fase 1. O produto é
// inferido pelo segmento do nome.
function openDataProduct(family: string): ProductKey {
  const key = family.slice('opendata-'.length)
  if (key.startsWith('accounts')) return 'contas'
  if (key.startsWith('creditcards')) return 'cartoes'
  if (
    key.startsWith('loans') ||
    key.startsWith('financings') ||
    key.startsWith('invoicefinancings') ||
    key.startsWith('unarranged')
  )
    return 'credito'
  if (key.startsWith('investments')) return 'investimentos'
  if (key.startsWith('exchange')) return 'cambio'
  if (
    key.startsWith('insurance') ||
    key.startsWith('pension') ||
    key.startsWith('capitalization')
  )
    return 'seguros'
  if (key.startsWith('acquiring')) return 'credenciamento'
  return 'outros'
}

export function classifyFamily(family: string): FamilyClass {
  if (family in EXPLICIT) return EXPLICIT[family]
  if (family.startsWith('opendata-'))
    return { phase: 'fase1', product: openDataProduct(family) }
  if (family.startsWith('channels_'))
    return { phase: 'fase1', product: 'canais' }
  return { phase: 'outros', product: 'outros' }
}

export type GroupMode = 'produto' | 'fase' | 'nenhum'

export interface ApiGroup {
  key: string
  label: string
  order: number
  apis: ApiResource[]
}

/** Agrupa as APIs de um Authorisation Server por produto ou fase. */
export function groupApis(apis: ApiResource[], mode: GroupMode): ApiGroup[] {
  if (mode === 'nenhum') {
    return [{ key: 'all', label: '', order: 0, apis }]
  }
  const map = new Map<string, ApiGroup>()
  for (const api of apis) {
    const cls = classifyFamily(api.ApiFamilyType)
    const key = mode === 'fase' ? cls.phase : cls.product
    const meta = mode === 'fase' ? PHASES[cls.phase] : PRODUCTS[cls.product]
    const label = mode === 'fase' ? PHASES[cls.phase].label : PRODUCTS[cls.product].label
    if (!map.has(key)) map.set(key, { key, label, order: meta.order, apis: [] })
    map.get(key)!.apis.push(api)
  }
  return [...map.values()].sort((a, b) => a.order - b.order)
}
