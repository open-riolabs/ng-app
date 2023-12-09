import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, tap } from 'rxjs/operators';
import { AuthActions, AuthActionsInternal } from './auth.actions';
import { AuthenticationService, EnvironmentConfiguration, RLB_CFG_ENV } from '@rlb/ng-app'

@Injectable()
export class AuthEffects {

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      tap(() => this.auth.login()),
      map(() => AuthActionsInternal.setLoading({ loading: true })),
    );
  });

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      concatMap(() => {
        return this.auth.logout$().pipe(
          map(() => AuthActionsInternal.reset()),
        )
      })
    );
  });

  constructor(
    private actions$: Actions,
    private auth: AuthenticationService,
    @Inject(RLB_CFG_ENV) envConfig: EnvironmentConfiguration) {

    if (envConfig?.featursMode === 'store') {
      this.auth.authorize()
        .pipe(
          tap(([{ isAuthenticated, userData, accessToken, idToken }]) => {
            AuthActionsInternal.setAuth({
              auth: {
                accessToken,
                idToken,
                isAuth: isAuthenticated,
                user: userData,
                loading: false
              }
            })
          }));
    }
  }
}
