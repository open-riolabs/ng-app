export interface KeycloakCredentials {
  type: string
  category: string
  displayName: string
  helptext: string
  iconCssClass: string
  updateAction?: string
  removeable: boolean
  userCredentialMetadatas: UserCredentialMetadata[]
  createAction?: string
}

export interface UserCredentialMetadata {
  credential: Credential
}

export interface Credential {
  id: string
  type: string
  userLabel: string
  createdDate: number
  credentialData: string
}
