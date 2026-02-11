import { Inject, Injectable, Optional } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthActions } from "../auth/auth.actions";
import { AclActions } from "./acl.actions";
import { catchError, of } from "rxjs";
import { AdminApiService } from "../../services/acl/user-resources.service";


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

  constructor(
    private actions$: Actions,
    private adminApi: AdminApiService
  ) {}
}
