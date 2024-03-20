export interface KeycloakUser {
  attributes: {};
  email: string;
  emailVerified: boolean,
  firstName: string;
  id: string;
  lastName: string;
  userProfileMetadata: {
    attributes: {
      name: string;
      displayName: string;
      multivalued: boolean;
      required: boolean;
      readOnly: boolean;
      validators: { [key: string]: any }[];
    }[],
    groups: {
      name: string;
      displayHeader: string;
      displayDescription: string;
    }[]
  },
  username: string;
}
