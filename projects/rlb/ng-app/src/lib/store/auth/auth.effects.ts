import { Inject, Injectable, Optional } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../auth/services/auth.service';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AuthActions, AuthActionsInternal } from './auth.actions';
import { AppLoggerService, LoggerContext } from '../../services/apps/app-logger.service';

@Injectable()
export class AuthEffects {
  private logger: LoggerContext;

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      tap(() => this.logger.log('auth effects going to call login()')),
      tap(() => this.auth.login()),
      map(() => AuthActionsInternal.setLoading({ loading: true })),
    );
  });

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.logger.log('auth effects going to call logout$()')),
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
    private loggerService: AppLoggerService,
    @Inject(RLB_CFG_AUTH) @Optional() authConfig: AuthConfiguration) {
    this.logger = this.loggerService.for(this.constructor.name);
    this.logger.log('Initialized AuthEffects');
    if (authConfig) {
      auth.checkAuthMultiple().subscribe();
    }
  }
}
