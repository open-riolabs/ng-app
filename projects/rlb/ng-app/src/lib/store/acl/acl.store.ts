import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AdminApiService } from "../../services/acl/user-resources.service";
import { initialAclState } from './acl.model';
import { catchError, from, map, of, switchMap, tap } from "rxjs";
import { RLB_INIT_PROVIDER } from '../../services/apps/rlb-init-provider';
import { RLB_CFG_ACL } from '../../configuration';
import { Store } from "@ngrx/store";
import { BaseState } from "../../store";
//import { ErrorManagementService } from "../../services/errors/error-management.service";

export const AclStore = signalStore(
  { providedIn: 'root' },
  withState(initialAclState),
  withMethods((
    store,
    adminApi = inject(AdminApiService),
    baseStore = inject(Store<BaseState>),
    rlbInitProvider = inject(RLB_INIT_PROVIDER, { optional: true }),
    aclConfiguration = inject(RLB_CFG_ACL, { optional: true })
  ) => ({

    hasPermission: (busId: string, resId: string, action?: string) => {
      const resources = store.resources();
      if (!resources) return false;
      return resources.some(company =>
        company.resourceBusinessId === busId &&
        company.resources.some(res => {
          const matchRes = res.resourceId === resId;
          return action ? (matchRes && res.actions.includes(action)) : matchRes;
        })
      );
    },

    // Load Logic: Replaces both Effects. Get user res + call via bridge finalizeApps
    loadACL() {
      patchState(store, { loading: true, loaded: false });
      return adminApi.resourcesByUser$().pipe(
        tap(resources => patchState(store, { resources, loaded: true, loading: false })),
        switchMap((resources) => {
          if (!rlbInitProvider) {
            console.error("RlbInitProvider not found. Define RLB_INIT_PROVIDER");
            return of(resources)
          }

          // Pass resources directly to the finalizer to prevent race condition problem
          return from(rlbInitProvider.finalizeApps(resources, baseStore, aclConfiguration)).pipe(
            map(() => resources),
            catchError((err) => {
              console.error('Finalization failed', err);
              return of(resources);
            })
          );
        })
      );
    },
    reset: () => patchState(store, initialAclState)
  }))
);
