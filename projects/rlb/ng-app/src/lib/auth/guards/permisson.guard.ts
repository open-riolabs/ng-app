import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { filter, map, take } from "rxjs";
import { AclStore } from "../../store/acl/acl.store";
import { toObservable } from "@angular/core/rxjs-interop";
import { AppsService } from "../../services";

export const permissionGuard: CanActivateFn = (route) => {
  const aclStore = inject(AclStore);
  const appsService = inject(AppsService);
  const router = inject(Router);

  // We wait for aclStore to load data
  return toObservable(aclStore.loaded).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      const action = route.data['action'];
      if (appsService.checkPermissionInCurrentApp(action)) {
        return true;
      }
      return router.createUrlTree(['/notFound']);
    })
  );
};
