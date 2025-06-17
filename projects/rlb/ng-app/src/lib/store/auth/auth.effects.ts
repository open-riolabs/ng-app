import { Inject, Injectable, Optional } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concatMap, map, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../auth/services/auth.service';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AuthActions, AuthActionsInternal } from './auth.actions';

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
        );
      })
    );
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
    store: Store,
    @Inject(RLB_CFG_AUTH) @Optional() authConfig: AuthConfiguration) {
    if (authConfig) {
      auth.authorize()
        .pipe(
          tap(([{ isAuthenticated, userData, accessToken, idToken }]) => {
            store.dispatch(AuthActionsInternal.setAuth({
              auth: {
                accessToken,
                idToken,
                isAuth: isAuthenticated,
                user: userData,
                loading: false,
              }
            }));
          })).subscribe();

      auth.idToken$.subscribe((idToken) => {
        store.dispatch(AuthActionsInternal.setIdToken({ idToken }));
      });
      auth.accessToken$.subscribe((accessToken) => {
        store.dispatch(AuthActionsInternal.setAccessToken({ accessToken }));
      });
      auth.userInfo$.subscribe((user) => {
        store.dispatch(AuthActionsInternal.setUser({ user }));
      });
      auth.isAuthenticated$.subscribe((isAuth) => {
        store.dispatch(AuthActionsInternal.setIsAuth({ isAuth }));
      });
    }
  }
}
