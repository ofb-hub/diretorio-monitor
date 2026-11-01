import { describe, expect, it } from 'vitest'
import type { AuthorisationServer } from '../types'
import { certHealth, formatCnpj, parseCertDate, prettyFamily, serverLifecycle } from './directory'
import { classifyFamily, groupApis } from './taxonomy'
import type { ApiResource } from '../types'

describe('parseCertDate', () => {
  it('lê dd/MM/yyyy como data local', () => {
    const d = parseCertDate('05/03/2027')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 2, 5])
  })

  it('retorna null para vazio ou inválido', () => {
    expect(parseCertDate(null)).toBeNull()
    expect(parseCertDate('não é data')).toBeNull()
  })
})

describe('certHealth', () => {
  const now = new Date(2026, 9, 31)
  it('classifica por dias até expirar', () => {
    expect(certHealth(null, now)).toBe('unknown')
    expect(certHealth(new Date(2026, 9, 30), now)).toBe('expired')
    expect(certHealth(new Date(2026, 9, 31), now)).toBe('expiring')
    expect(certHealth(new Date(2027, 0, 29), now)).toBe('expiring') // 90 dias
    expect(certHealth(new Date(2027, 0, 30), now)).toBe('ok')
  })
})

describe('serverLifecycle', () => {
  const base = {
    DeprecatedDate: null,
    RetirementDate: null,
    SupersededByAuthorisationServerId: null,
  } as AuthorisationServer
  const now = new Date('2026-10-31T12:00:00Z')

  it('sem datas não gera badges', () => {
    expect(serverLifecycle(base, now)).toEqual([])
  })

  it('distingue agendado de já ocorrido', () => {
    const labels = serverLifecycle(
      { ...base, DeprecatedDate: '2026-01-01T00:00:00Z', RetirementDate: '2027-01-01T00:00:00Z' },
      now,
    ).map((b) => b.label)
    expect(labels).toEqual(['Descontinuado', 'Aposentadoria agendada'])
  })
})

describe('formatCnpj / prettyFamily', () => {
  it('formata CNPJ com 14 dígitos e preserva o resto', () => {
    expect(formatCnpj('60701190000104')).toBe('60.701.190/0001-04')
    expect(formatCnpj('123')).toBe('123')
    expect(formatCnpj(null)).toBe('—')
  })

  it('deixa o nome da família legível', () => {
    expect(prettyFamily('payments-pix')).toBe('Payments Pix')
    expect(prettyFamily('channels_branches')).toBe('Channels · Branches')
  })
})

describe('taxonomia', () => {
  it('classifica famílias explícitas, opendata e channels', () => {
    expect(classifyFamily('payments-pix')).toEqual({ phase: 'fase3', product: 'pagamentos' })
    expect(classifyFamily('opendata-creditcards_personal-credit-cards')).toEqual({
      phase: 'fase1',
      product: 'cartoes',
    })
    expect(classifyFamily('channels_branches').product).toBe('canais')
  })

  it('não confunde nomes do protótipo com famílias conhecidas', () => {
    expect(classifyFamily('constructor')).toEqual({ phase: 'outros', product: 'outros' })
  })

  it('agrupa e ordena por produto', () => {
    const api = (f: string) => ({ ApiFamilyType: f }) as ApiResource
    const groups = groupApis([api('payments-pix'), api('accounts'), api('consents')], 'produto')
    expect(groups.map((g) => g.key)).toEqual(['contas', 'pagamentos', 'consentimento'])
  })
})
