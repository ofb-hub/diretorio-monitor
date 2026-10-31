import { describe, expect, it } from 'vitest'
import type { AuthorisationServer, Organisation } from '../types'
import { matchOrganisation, normalizeText } from './search'

function org(partial: Partial<Organisation> & { servers?: Partial<AuthorisationServer>[] }) {
  const { servers = [], ...rest } = partial
  return {
    OrganisationId: '74e929d9-33b6-4d85-8ba7-c146c867a817',
    OrganisationName: 'Banco Exemplo',
    LegalEntityName: 'Banco Exemplo S.A.',
    RegistrationNumber: '60701190000104',
    AuthorisationServers: servers.map((s) => ({
      AuthorisationServerId: 'b8f1c2d3-0000-4000-8000-000000000001',
      CustomerFriendlyName: null,
      ...s,
    })),
    ...rest,
  } as Organisation
}

describe('normalizeText', () => {
  it('ignora acentos e caixa', () => {
    expect(normalizeText('Crédito Itaú')).toBe('credito itau')
    expect(normalizeText(null)).toBe('')
  })
})

describe('matchOrganisation', () => {
  it('busca vazia casa tudo', () => {
    expect(matchOrganisation(org({}), '  ').hit).toBe(true)
  })

  it('casa nome com e sem acento', () => {
    const o = org({ OrganisationName: 'Cooperativa de Crédito' })
    expect(matchOrganisation(o, 'credito').hit).toBe(true)
    expect(matchOrganisation(o, 'CRÉDITO').hit).toBe(true)
  })

  it('casa CNPJ só para busca numérica', () => {
    const o = org({})
    expect(matchOrganisation(o, '60.701.190').hit).toBe(true)
    expect(matchOrganisation(o, '60701190/0001-04').hit).toBe(true)
    // Dígitos misturados a texto não viram busca por CNPJ.
    expect(matchOrganisation(o, 'banco 2').hit).toBe(false)
    expect(matchOrganisation(o, 'x701').hit).toBe(false)
  })

  it('exige um mínimo de dígitos para buscar CNPJ', () => {
    expect(matchOrganisation(org({}), '01').hit).toBe(false)
  })

  it('casa trecho de ID de org e de server', () => {
    const o = org({ servers: [{}] })
    expect(matchOrganisation(o, '74e929d9').hit).toBe(true)
    expect(matchOrganisation(o, 'B8F1C2').hit).toBe(true)
  })

  it('casa marca e informa qual marca quando o nome não casa', () => {
    const o = org({ servers: [{ CustomerFriendlyName: 'Banco Digitál' }, { CustomerFriendlyName: 'Outro' }] })
    expect(matchOrganisation(o, 'digital')).toEqual({ hit: true, matchedBrands: ['Banco Digitál'] })
  })

  it('não lista marcas quando o nome da org já explica o match', () => {
    const o = org({ servers: [{ CustomerFriendlyName: 'Banco Exemplo App' }] })
    expect(matchOrganisation(o, 'exemplo').matchedBrands).toEqual([])
  })
})
