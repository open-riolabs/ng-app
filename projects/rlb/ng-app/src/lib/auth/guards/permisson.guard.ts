import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { inject } from "@angular/core";
import { filter, map, Observable, take } from "rxjs";
import { AclStore } from "../../store/acl/acl.store";
import { toObservable } from "@angular/core/rxjs-interop";

export const permissionGuard: CanActivateFn = (route) => {
  const store = inject(AclStore);
  const router = inject(Router);

  const resource = route.data['resource'];
  const action = route.data['action'];

  // toObservable helps wait for 'loaded' to be true
  return toObservable(store.loaded).pipe(
    filter(Boolean),
    take(1),
    map(() =>
      store.hasPermission(resource, action)
        ? true
        : router.createUrlTree(['/notFound'])
    )
  );
};
