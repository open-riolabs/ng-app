import { Inject, Injectable, Optional } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../auth/services/auth.service';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AuthActions, AuthActionsInternal } from './auth.actions';

@Injectable()
export class AuthEffects {

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      tap(() => this.auth.login())
    );
  });

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() => this.auth.logout$()),
      map(() => AuthActionsInternal.reset()));
  });

  setCurrentProvider$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.setCurrentProvider),
      map(({ currentProvider }) => AuthActionsInternal.setCurrentProvider({ currentProvider }))
    );
  });

  constructor(
    private actions$: Actions,
    private auth: AuthenticationService,
    @Inject(RLB_CFG_AUTH) @Optional() authConfig: AuthConfiguration) {
    if (authConfig) {
      auth.checkAuthMultiple().subscribe();
    }
  }
}
