import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import { SidebarActions, SidebarActionsInternal } from './sidebar.actions';

@Injectable()
export class SidebarEffects {

  items$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.update),
      map(({ items }) => SidebarActionsInternal.update({ items })),
    );
  });

  showLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setHasLogin),
      map(({ visible }) => SidebarActionsInternal.setHasLogin({ visible })),
    );
  });

  showSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setHasSearch),
      map(({ visible }) => SidebarActionsInternal.setHasSearch({ visible })),
    );
  });

  show$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SidebarActions.setVisible),
      map(({ visible }) => SidebarActionsInternal.setVisible({ visible })),
    );
  });

  constructor(private actions$: Actions) { }
}
