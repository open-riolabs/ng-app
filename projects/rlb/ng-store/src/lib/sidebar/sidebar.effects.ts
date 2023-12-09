import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, delay, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SidebarActions, SidebarActionsInternal } from './sidebar.actions';
import { SidebarService } from '@rlb/ng-app'

@Injectable()
export class SidebarEffects {

  items$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.update),
      tap(({ items }) => this.side.setSidebarItems(items))
    );
  });

  showLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setHasLogin),
      tap(({ visible }) => this.side.setShowLogin(visible))
    );
  });

  showSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setHasSearch),
      tap(({ visible }) => this.side.setShowSearch(visible))
    );
  });

  show$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setVisible),
      tap(({ visible }) => this.side.setShow(visible))
    );
  });

  constructor(private actions$: Actions, private side: SidebarService) { }
}
