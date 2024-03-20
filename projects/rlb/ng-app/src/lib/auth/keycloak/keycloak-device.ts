export interface KeycloakDevice {
  os: string
  osVersion: string
  device: string
  lastAccess: number
  current: boolean
  sessions: KeycloakSession[]
  mobile: boolean
}

export interface KeycloakSession {
  id: string
  ipAddress: string
  started: number
  expires: number
  clients: KeycloakClient[]
  browser: string
  os: string
  osVersion: string
  device: string
  lastAccess: number
  current: boolean
  mobile: boolean,
  clientslist: string
}

export interface KeycloakClient {
  clientId: string
  clientName: string
  userConsentRequired: boolean
  inUse: boolean
  offlineAccess: boolean
}
