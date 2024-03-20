export interface KeycloakCredential {
  type: string
  category: string
  displayName: string
  helptext: string
  iconCssClass: string
  updateAction?: string
  removeable: boolean
  userCredentialMetadatas: KeycloakUserCredentialMetadata[]
  createAction?: string
}

export interface KeycloakUserCredentialMetadata {
  credential: _KeycloakCredential
}

export interface _KeycloakCredential {
  id: string
  type: string
  userLabel: string
  createdDate: number
  credentialData: string
}
