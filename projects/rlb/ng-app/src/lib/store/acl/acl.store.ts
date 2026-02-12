import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { tapResponse } from '@ngrx/operators';
import { AdminApiService } from "../../services/acl/user-resources.service";
import { initialAclState } from './acl.model';
//import { ErrorManagementService } from "../../services/errors/error-management.service";

export const AclStore = signalStore(
  { providedIn: 'root' },
  withState(initialAclState),
  withMethods((
    store,
    adminApi = inject(AdminApiService),
    //errorManagement = inject(ErrorManagementService)
  ) => ({
    // REUSABLE LOGIC: Will be used in guard
    hasPermission: (resourceName: string, action?: string) => {
      const resources = store.resources();
      if (!resources) return false;

      return resources.some(product =>
        product.resources.some(res => {
          const matchName = res.resourceId === resourceName || res.resourceName === resourceName;
          if (!action) return matchName;
          return matchName && res.actions.includes(action);
        })
      );
    },
    // Replaces legacy ngrx action and the effect
    loadACL() {
      patchState(store, { loading: true, loaded: false });

      return adminApi.resourcesByUser$().pipe(
        //errorManagement.manageUI('error', 'dialog'),
        tapResponse({
          next: (resources) => patchState(store, { resources, loaded: true, loading: false }),
          error: (error) => {
            console.error('ACL Load Failed', error);
            patchState(store, { error, loaded: true, loading: false });
          },
        })
      );
    },
    reset: () => patchState(store, initialAclState)
  }))
);
