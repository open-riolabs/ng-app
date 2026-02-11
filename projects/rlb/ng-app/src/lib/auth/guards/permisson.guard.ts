import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { aclFeatureKey } from "../../store/acl/acl.model";
import { map } from "rxjs";

export const permissionGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const requiredResource = route.data['resource'];

  //this.store.select(state => state[sidebarsFeatureKey].visible);

  return store.select(state => state[aclFeatureKey]).pipe(
    map(resources => {
      console.log("permission guard", resources);
      //TODO understand here how to handle route guard
      return true
      //return hasPermission;
    })
  );
};
