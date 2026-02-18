import { Inject, Injectable, Optional } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap } from 'rxjs/operators';
import { AuthActions } from "../auth/auth.actions";
import { AclActions } from "./acl.actions";
import { catchError, of } from "rxjs";
import { AdminApiService } from "../../services/acl/user-resources.service";
import { Store } from '@ngrx/store';
import { RLB_INIT_PROVIDER, RlbInitProvider } from '../../services/apps/rlb-init-provider';
import { AclConfiguration, RLB_CFG_ACL } from '../../configuration';
import { BaseState } from '..';


@Injectable()
export class AclEffects {
  loadAclOnAuth$ = createEffect(() => {
    return this.actions$.pipe(
      // Listen for the action dispatched in AuthenticationService.checkAuthMultiple
      ofType(AuthActions.setCurrentProvider),
      map(() => AclActions.loadACL())
    );
  });

  fetchAcl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AclActions.loadACL),
      switchMap(() => this.adminApi.resourcesByUser$().pipe(
        map(resources => AclActions.loadACLSuccess({ resources })),
        catchError(error => of(AclActions.loadACLFailure({ error })))
      ))
    );
  });

  // TODO: It's legacy approach. We're moving forward to signalStore. All legacy boilerplate (effects.ts, reducers.ts, actions.ts) will be removed soon
  // I've moved this logic into acl.store.ts -> loadACL() method

  // finalizeAppsOnAclLoad$ = createEffect(() => {
  //   return this.actions$.pipe(
  //     ofType(AclActions.loadACLSuccess),
  //     switchMap(() => {
  //       if (!this.rlbInitProvider) {
  //         console.error("RlbInitProvider not found. Define RLB_INIT_PROVIDER");
  //         return of(AclActions.finalizedAppsFailure());
  //       }
  //       return from(
  //         this.rlbInitProvider.finalizeApps(this.store, this.aclConfiguration)
  //       ).pipe(
  //         map(() => AclActions.finalizedAppsSuccess()),
  //         catchError(() => of(AclActions.finalizedAppsFailure()))
  //       );
  //     }));
  // });


  constructor(
    private actions$: Actions,
    private adminApi: AdminApiService,
    @Optional() @Inject(RLB_INIT_PROVIDER) private rlbInitProvider: RlbInitProvider,
    @Optional() @Inject(RLB_CFG_ACL) private aclConfiguration: AclConfiguration,
    private store: Store<BaseState>
  ) { }
}
