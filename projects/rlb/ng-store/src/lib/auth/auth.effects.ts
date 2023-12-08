import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { concatMap, delay, map, tap } from 'rxjs/operators';
import { Observable, EMPTY, of } from 'rxjs';
import { AuthActions, AuthActionsInternal } from './auth.actions';

import { AuthenticationService } from '@rlb/ng-app'

@Injectable()
export class AuthEffects {


  login$ = createEffect(() => {
    return this.actions$.pipe(

      ofType(AuthActions.login),
      /** An EMPTY observable only emits completion. Replace with your own observable API request */

      concatMap(() => {
        return of("pippo").pipe(
          delay(2000),
          map(data => AuthActionsInternal.setIdToken({ token: data })),
        )
      })
    );
  });

  constructor(private actions$: Actions) { }
}
