import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { AclAction, initialAclState, normalizeAclActions } from './acl.model';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';
import { RLB_INIT_PROVIDER } from '../../services/apps/rlb-init-provider';
import { ProviderAclConfiguration, RLB_CFG_ACL } from '../../configuration';
import { Store } from '@ngrx/store';
import { BaseState } from '../base-state';

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
      /**
       * Whether the user holds `action` on the `(busId, resId)` resource.
       *
       * `action` may be a list, in which case **any** of them grants — this is the single
       * implementation of that OR, shared by the `*roles` directive and the guards, so nobody
       * re-implements the loop against a subset of the semantics.
       *
       * No action (or an empty list) keeps its original meaning: *any* grant on that resource.
       */
      hasPermission: (busId: string, resId: string, action?: AclAction) => {
        const resources = store.resources();
        if (!resources) return false;
        const actions = normalizeAclActions(action);
        return resources.some(
          company =>
            company.companyId === busId &&
            company.resources.some(res => {
              const matchRes = res.resourceId === resId;
              if (!matchRes) return false;
              return actions.length === 0 || actions.some(a => res.actions.includes(a));
            }),
        );
      },

      /**
       * Whether the user holds `action` on **any** resource they have, ignoring which app is
       * current.
       *
       * Chrome that is not owned by an app — the `pages.*` entries rendered in the settings
       * dropdown and list — has no `(busId, resId)` to check against, and while one of those pages
       * is open `AppsService` has deselected the current app anyway. Resource-scoped checks answer
       * "no" there for the wrong reason, so those surfaces use this one.
       */
      hasPermissionAnywhere: (action?: AclAction) => {
        const resources = store.resources();
        if (!resources) return false;
        const actions = normalizeAclActions(action);
        return resources.some(company =>
          company.resources.some(
            res => actions.length === 0 || actions.some(a => res.actions.includes(a)),
          ),
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
