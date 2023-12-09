import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NavbarService } from '@rlb/ng-app'
import { tap } from 'rxjs/operators';
import { NavbarActions } from './navbar.actions';

@Injectable()
export class NavbarEffects {

  items$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.update),
      tap(({ items }) => this.nav.setNavbarItems(items))
    );
  });

  showLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasLogin),
      tap(({ visible }) => this.nav.setShowLogin(visible))
    );
  });

  showSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setHasSearch),
      tap(({ visible }) => this.nav.setShowSearch(visible))
    );
  });

  show$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NavbarActions.setVisible),
      tap(({ visible }) => this.nav.setShow(visible))
    );
  });

  constructor(private actions$: Actions, private nav: NavbarService) { }
}
