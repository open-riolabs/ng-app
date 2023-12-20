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
    SetItems: props<{ items: NavigableItem[] }>(),
    SetVisible: props<{ visible: boolean }>(),
    SetLoginVisible: props<{ visible: boolean }>(),
    SetSearchVisible: props<{ visible: boolean }>(),
    SetSettingsVisible: props<{ visible: boolean }>(),
  }
});
