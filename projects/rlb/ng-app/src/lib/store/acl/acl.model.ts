export const aclFeatureKey = 'acl';


export interface UserResource {
  productId: string;
  resources: Resource[];
}

export interface Resource {
  resourceId: string;
  actions: string[];
  resourceName: string;
  companyId: string;
}

export interface Acl {
  resources: UserResource[] | null;
  loading: boolean;
  loaded: boolean;
  error: any;
}

export const initialAclState: Acl = {
  resources: null,
  loading: false,
  loaded: false,
  error: null
};

export interface AclState { [aclFeatureKey]: Acl }
