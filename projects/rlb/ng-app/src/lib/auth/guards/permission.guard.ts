import { CanActivateFn, Router } from '@angular/router';
import { inject, Signal } from '@angular/core';
import { filter, map, Observable, take } from 'rxjs';
import { AclStore } from '../../store/acl/acl.store';
import { AclAction } from '../../store/acl/acl.model';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppsService } from '../../services';

/**
 * Where a denial lands. The route is registered unconditionally by `getDefaultRoutes` — it used to
 * depend on `pages.forbidden` being configured, and where it was not, a denial fell through to the
 * consumer's `**` route and presented as a redirect to an unrelated page with nothing logged.
 */
const FORBIDDEN_URL = '/forbidden';

/**
 * Requires the ACL action named in `route.data.action` **in the app that owns the route**.
 *
 * `data.action` may be a list, in which case any one of them grants.
 */
export const permissionGuard: CanActivateFn = route => {
  const aclStore = inject(AclStore);
  const appsService = inject(AppsService);
  const router = inject(Router);

  return whenAclLoaded(aclStore.loaded).pipe(
    map(() => {
      const action = route.data['action'] as AclAction | undefined;

      // Default case: currentApp already selected (any navigation after the first).
      if (appsService.currentApp()) {
        return appsService.checkPermissionInCurrentApp(action)
          ? true
          : router.createUrlTree([FORBIDDEN_URL]);
      }

      // Deep-link case: currentApp still not processed by AppsService, so we extract ACL data from route and check permissions
      const routePath = route.pathFromRoot
        .flatMap(r => r.url)
        .map(seg => seg.path)
        .filter(Boolean)
        .join('/');

      const resolvedApp = appsService.findAppForPath(routePath);
      if (resolvedApp && appsService.checkPermissionForApp(resolvedApp, action)) {
        return true;
      }
      return router.createUrlTree([FORBIDDEN_URL]);
    }),
  );
};

/**
 * Requires `action` on **any** resource the user holds — the guard for chrome that no app owns.
 *
 * `getDefaultRoutes` puts this on every `pages.*` entry that declares an `action`. Use it for the
 * pages the kit cannot register for you (`status`, `logger`, …) so the route and the settings
 * button that links to it agree:
 *
 * ```typescript
 * { path: 'status', component: StatusComponent, canActivate: [pagePermissionGuard('show-status')] }
 * ```
 *
 * `permissionGuard` is the wrong tool here: while a `pages.*` route is open `AppsService` has
 * deselected the current app, and no app claims the path, so it denies whatever the user holds.
 */
export function pagePermissionGuard(action?: AclAction): CanActivateFn {
  return () => {
    const aclStore = inject(AclStore);
    const appsService = inject(AppsService);
    const router = inject(Router);

    return whenAclLoaded(aclStore.loaded).pipe(
      map(() =>
        appsService.checkPermissionAnywhere(action) ? true : router.createUrlTree([FORBIDDEN_URL]),
      ),
    );
  };
}

/** Holds the navigation until the ACL resources have arrived, so nobody is denied for being early. */
function whenAclLoaded(loaded: Signal<boolean>): Observable<boolean> {
  return toObservable(loaded).pipe(filter(Boolean), take(1));
}
