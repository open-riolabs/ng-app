import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import { NavbarActions, NavbarActionsInternal } from './navbar.actions';

@Injectable()
export class NavbarEffects {

  items$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.update),
      map(({ items }) => NavbarActionsInternal.update({ items })),
    );
  });

  showLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasLogin),
      map(({ visible }) => NavbarActionsInternal.setHasLogin({ visible })),
    );
  });

  showSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasSearch),
      map(({ visible }) => NavbarActionsInternal.setHasSearch({ visible })),
    );
  });

  show$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setVisible),
      map(({ visible }) => NavbarActionsInternal.setVisible({ visible })),
    );
  });

  constructor(private actions$: Actions) { }
}
