import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserResource } from "./acl.model";


export const AclActions = createActionGroup({
  source: 'ACL',
  events: {
    'Load ACL': emptyProps(),
    'Load ACL Success': props<{ resources: UserResource[] }>(),
    'Load ACL Failure': props<{ error: any }>(),
    'Reset': emptyProps(),
  }
});
