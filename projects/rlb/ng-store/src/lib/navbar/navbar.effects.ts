import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, delay, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavbarActions, NavbarActionsInternal } from './navbar.actions';

@Injectable()
export class NavbarEffects {


  login$ = createEffect(() => {
    return this.actions$.pipe(

      // ofType(NavbarActions.login),
      // /** An EMPTY observable only emits completion. Replace with your own observable API request */

      // concatMap(() => {
      //   return of("pippo").pipe(
      //     delay(2000),
      //     map(data => NavbarActionsInternal.setIdToken({ token: data })),
      //   )
      // })
    );
  });

  constructor(private actions$: Actions) { }
}
