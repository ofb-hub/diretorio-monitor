// Modelo de dados do Diretório de Participantes do Open Finance Brasil
// Fonte: https://data.directory.openbankingbrasil.org.br/participants

export interface ApiDiscoveryEndpoint {
  ApiDiscoveryId: string
  ApiEndpoint: string
}

export interface ApiResource {
  ApiResourceId: string
  ApiVersion: string
  ApiFamilyID: string
  FamilyComplete: boolean
  ApiCertificationUri: string | null
  CertificationStatus: string | null
  CertificationStartDate: string | null
  CertificationExpirationDate: string | null
  ApiFamilyType: string
  Status: string
  ApiDiscoveryEndpoints: ApiDiscoveryEndpoint[]
}

export interface AuthorisationServerCertification {
  CertificationStartDate: string | null
  CertificationExpirationDate: string | null
  CertificationId: string
  AuthorisationServerId: string
  CertificationStatus: string | null
  ProfileVariant: string | null
  ProfileType: string | null
  ProfileVersion: number | null
  CertificationURI: string | null
  Status: string | null
}

export interface AuthorisationServer {
  AuthorisationServerId: string
  OrganisationId: string
  CustomerFriendlyName: string | null
  CustomerFriendlyDescription: string | null
  CustomerFriendlyLogoUri: string | null
  DeveloperPortalUri: string | null
  TermsOfServiceUri: string | null
  Issuer: string | null
  OpenIDDiscoveryDocument: string | null
  PayloadSigningCertLocationUri: string | null
  Status: string
  CreatedAt: string | null
  SupportsCiba: boolean
  SupportsDCR: boolean
  SupportsRedirect: boolean
  AutoRegistrationSupported: boolean
  ApiResources: ApiResource[]
  AuthorisationServerCertifications: AuthorisationServerCertification[]
  Flags: Record<string, string[]> | null
}

export interface OrgDomainRoleClaim {
  AuthorisationDomain: string | null
  AuthorisationDomainRoleIdentifier: string | null
  Role: string | null
  RegistrationId: string | null
  Status: string | null
  RoleType: string | null
  Exclusive: boolean
}

export interface OrgDomainClaim {
  AuthorisationDomainName?: string | null
  AuthorityId?: string | null
  AuthorityName?: string | null
  RegistrationId?: string | null
  Status?: string | null
}

export interface Organisation {
  OrganisationId: string
  Status: string
  OrganisationName: string
  CreatedOn: string | null
  LegalEntityName: string | null
  CountryOfRegistration: string | null
  RegistrationNumber: string | null // CNPJ
  RegistrationId: string | null
  RegisteredName: string | null
  AddressLine1: string | null
  AddressLine2: string | null
  City: string | null
  Postcode: string | null
  Country: string | null
  ParentOrganisationReference: string | null
  Flags: Record<string, string[]> | null
  AuthorisationServers: AuthorisationServer[]
  OrgDomainClaims: OrgDomainClaim[]
  OrgDomainRoleClaims: OrgDomainRoleClaim[]
}

// ---- Estruturas normalizadas/derivadas para a UI ----

/** Estado de validade de uma certificação em relação a hoje. */
export type CertHealth = 'ok' | 'expiring' | 'expired' | 'unknown'

export interface CertRow {
  organisationId: string
  organisationName: string
  authorisationServerId: string
  serverName: string
  certificationId: string
  profileVariant: string | null
  profileType: string | null
  status: string | null
  startDate: string | null
  expirationDate: string | null
  expirationDateObj: Date | null
  daysToExpire: number | null
  health: CertHealth
}

export interface ApiRow {
  organisationId: string
  organisationName: string
  authorisationServerId: string
  serverName: string
  apiResourceId: string
  familyType: string
  version: string
  status: string
  certificationStatus: string | null
  familyComplete: boolean
  endpointCount: number
}

export interface DirectoryStats {
  totalOrganisations: number
  activeOrganisations: number
  totalServers: number
  totalApis: number
  orgsPf: number
  orgsPj: number
  certsOk: number
  certsExpiring: number
  certsExpired: number
  apiFamilyCounts: { name: string; value: number }[]
  roleCounts: { name: string; value: number }[]
  certStatusCounts: { name: string; value: number }[]
}

export interface DirectorySnapshot {
  organisations: Organisation[]
  fetchedAt: number // epoch ms
}
