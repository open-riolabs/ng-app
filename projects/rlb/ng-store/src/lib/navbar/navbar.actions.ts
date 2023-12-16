import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NavigableItem } from '@rlb/ng-bootstrap'
export const NavbarActionsInternal = createActionGroup({
  source: 'Navbar/Internal',
  events: {
    Update: props<{ items: NavigableItem[] }>(),
    SetVisible: props<{ visible: boolean }>(),
    SetHasSearch: props<{ visible: boolean }>(),
    SetHasLogin: props<{ visible: boolean }>()
  }
});


export const NavbarActions = createActionGroup({
  source: 'Navbar/API',
  events: {
    Update: props<{ items: NavigableItem[] }>(),
    SetVisible: props<{ visible: boolean }>(),
    SetHasSearch: props<{ visible: boolean }>(),
    SetHasLogin: props<{ visible: boolean }>()
  }
});
