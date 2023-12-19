import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, tap } from 'rxjs/operators';
import { AuthActions, AuthActionsInternal } from './auth.actions';
import { Store } from '@ngrx/store';
import { AuthenticationService } from '../../auth/services/auth.service';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';

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
    store: Store,
    @Inject(RLB_CFG_ENV) envConfig: EnvironmentConfiguration) {
    auth.authorize()
      .pipe(
        tap(([{ isAuthenticated, userData, accessToken, idToken }]) => {
          store.dispatch(AuthActionsInternal.setAuth({
            auth: {
              accessToken,
              idToken,
              isAuth: isAuthenticated,
              user: userData,
              loading: false
            }
          }))
        })).subscribe();

    auth.idToken$.subscribe((idToken) => {
      store.dispatch(AuthActionsInternal.setIdToken({ idToken }))
    })
    auth.accessToken$.subscribe((accessToken) => {
      store.dispatch(AuthActionsInternal.setAccessToken({ accessToken }))
    })
    auth.userInfo$.subscribe((user) => {
      store.dispatch(AuthActionsInternal.setUser({ user }))
    })
    auth.isAuthenticated$.subscribe((isAuth) => {
      store.dispatch(AuthActionsInternal.setIsAuth({ isAuth }))
    })
  }
}
