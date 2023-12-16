import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NavbarService } from '@rlb/ng-app'
import { map, tap } from 'rxjs/operators';
import { NavbarActions, NavbarActionsInternal } from './navbar.actions';

@Injectable()
export class NavbarEffects {

  items$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.update),
      tap(({ items }) => this.nav.setNavbarItems(items)),
      map(({ items }) => NavbarActionsInternal.update({ items })),
    );
  });

  showLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasLogin),
      tap(({ visible }) => this.nav.setShowLogin(visible)),
      map(({ visible }) => NavbarActionsInternal.setHasLogin({ visible })),
    );
  });

  showSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasSearch),
      tap(({ visible }) => this.nav.setShowSearch(visible)),
      map(({ visible }) => NavbarActionsInternal.setHasSearch({ visible })),
    );
  });

  show$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setVisible),
      tap(({ visible }) => this.nav.setShow(visible)),
      map(({ visible }) => NavbarActionsInternal.setVisible({ visible })),
    );
  });

  constructor(private actions$: Actions, private nav: NavbarService) { }
}
