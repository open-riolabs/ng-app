import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { initialAclState } from './acl.model';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';
import { RLB_INIT_PROVIDER } from '../../services/apps/rlb-init-provider';
import { ProviderAclConfiguration, RLB_CFG_ACL } from '../../configuration';
import { Store } from '@ngrx/store';
import { BaseState } from '../../store';

export const AclStore = signalStore(
  { providedIn: 'root' },
  withState(initialAclState),
  withMethods(
    (
      store,
      adminApi = inject(AdminApiService),
      baseStore = inject(Store<BaseState>),
      rlbInitProvider = inject(RLB_INIT_PROVIDER, { optional: true }),
      aclConfiguration = inject(RLB_CFG_ACL, { optional: true }),
    ) => ({
      hasPermission: (busId: string, resId: string, action?: string) => {
        const resources = store.resources();
        if (!resources) return false;
        return resources.some(
          company =>
            company.resourceBusinessId === busId &&
            company.resources.some(res => {
              const matchRes = res.resourceId === resId;
              return action ? matchRes && res.actions.includes(action) : matchRes;
            }),
        );
      },

      // Load Logic: Replaces both Effects. Get user res + call via bridge finalizeApps
      // Accept the provider's ACL config
      loadACL(providerAcl?: ProviderAclConfiguration) {
        // IF NO ACL CONFIGURATION -> BYPASS
        if (!providerAcl) {
          patchState(store, { resources: [], loaded: true, loading: false });

          // Even if empty, we execute finalizeApps so the pipeline doesn't hang
          if (rlbInitProvider) {
            return from(rlbInitProvider.finalizeApps([], baseStore, aclConfiguration)).pipe(
              map(() => []),
              catchError(err => {
                console.error('Finalization failed during bypass', err);
                return of([]);
              }),
            );
          }
          return of([]);
        }

        // IF ACL CONFIG EXISTS -> FETCH RESOURCES
        patchState(store, { loading: true, loaded: false });

        return adminApi.resourcesByUser$(providerAcl.endpointKey, providerAcl.path).pipe(
          tap(resources => patchState(store, { resources, loaded: true, loading: false })),
          switchMap(resources => {
            if (!rlbInitProvider) {
              return of(resources);
            }
            return from(rlbInitProvider.finalizeApps(resources, baseStore, aclConfiguration)).pipe(
              map(() => resources),
              catchError(err => {
                console.error('Finalization failed', err);
                return of(resources);
              }),
            );
          }),
        );
      },
      reset: () => patchState(store, initialAclState),
    }),
  ),
);
