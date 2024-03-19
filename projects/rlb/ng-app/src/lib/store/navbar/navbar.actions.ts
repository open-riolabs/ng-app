import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NavigableItem } from '@rlb/ng-bootstrap'
export const NavbarActionsInternal = createActionGroup({
  source: 'Navbar/Internal',
  events: {}
});


export const NavbarActions = createActionGroup({
  source: 'Navbar/API',
  events: {
    SetVisible: props<{ visible: boolean }>(),
    SetSearchVisible: props<{ visible: boolean }>(),
    SetHeader: props<{ header: string | null }>(),
    SetSearchText: props<{ text: string | null }>(),
    SetLeftItems: props<{ items: string[] }>(),
    SetRightItems: props<{ items: string[] }>(),
  }
});
