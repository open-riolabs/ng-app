import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { Acl, aclFeatureKey } from "../../store/acl/acl.model";
import { filter, map, Observable, take } from "rxjs";

export const permissionGuard: CanActivateFn = (route): Observable<boolean | UrlTree> => {
  console.log("permission guard", route);
  const store = inject(Store);
  const router = inject(Router);

  // Get requirements from route data
  const requiredResource = route.data['resource'] as string;
  const requiredAction = route.data['action'] as string;

  return store.select(state => state[aclFeatureKey]).pipe(
    // Wait until the Initializer/Effect has actually finished loading the data
    filter((acl: Acl) => acl.loaded),
    take(1),
    map((acl) => {
      console.log("permission guard map", JSON.stringify(acl));
      if (!acl.resources) return router.createUrlTree(['/not-found']);

      const hasPermission = acl.resources.some(product =>
        product.resources.some(res => {
          const matchName = res.resourceId === requiredResource || res.resourceName === requiredResource;

          if (!requiredAction) {
            return matchName;
          }

          return matchName && res.actions.includes(requiredAction);
        })
      );

      if (hasPermission) {
        return true;
      }

      // Redirect on failure
      console.warn(`Access denied for resource: ${requiredResource}`);
      return router.createUrlTree(['/notFound']);
    })
  );
};
