import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Sidebar } from './sidebar.model';
import { NavigableItem } from '@rlb/ng-bootstrap';

export const SidebarActionsInternal = createActionGroup({
  source: 'Sidebar/Internal',
  events: {}
});


export const SidebarActions = createActionGroup({
  source: 'Sidebar/API',
  events: {
    Update: props<{ items: NavigableItem[] }>(),
    SetVisible: props<{ visible: boolean }>(),
    SetHasSearch: props<{ visible: boolean }>(),
    SetHasLogin: props<{ visible: boolean }>()
  }
});
