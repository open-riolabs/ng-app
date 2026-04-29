import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { filter, map, take } from 'rxjs';
import { AclStore } from '../../store/acl/acl.store';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppsService } from '../../services';

export const permissionGuard: CanActivateFn = route => {
  const aclStore = inject(AclStore);
  const appsService = inject(AppsService);
  const router = inject(Router);

  return toObservable(aclStore.loaded).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      const action = route.data['action'];

      // Default case: currentApp already selected (any navigation after the first).
      if (appsService.currentApp()) {
        return appsService.checkPermissionInCurrentApp(action)
          ? true
          : router.createUrlTree(['/forbidden']);
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
      return router.createUrlTree(['/forbidden']);
    }),
  );
};
