export const aclFeatureKey = 'acl';


export interface UserResource {
  companyId: string;
  resources: Resource[];
}

export interface Resource {
  resourceId: string;
  actions: string[];
  friendlyName?: string;
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

/**
 * What a caller may pass where an ACL action is expected: one action, or a list the user only has
 * to hold **one** of ("management and superior" style checks).
 */
export type AclAction = string | string[];

/**
 * Reduces an action input to the list actually checked.
 *
 * `undefined`, `null`, `''` and `[]` all collapse to an empty list, which every consumer of this
 * helper reads as "no action asked for" — public, or "any grant on the resource", depending on the
 * caller. An empty array must never mean "deny": a consumer computing the list dynamically would
 * otherwise get a blank UI the first time the list comes back empty.
 */
export function normalizeAclActions(action?: AclAction | null): string[] {
  if (action === undefined || action === null) return [];
  const list = Array.isArray(action) ? action : [action];
  return list.filter((a): a is string => typeof a === 'string' && a.length > 0);
}
