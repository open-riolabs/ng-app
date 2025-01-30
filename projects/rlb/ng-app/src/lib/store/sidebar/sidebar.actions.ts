import { createActionGroup, props } from '@ngrx/store';
import { SidebarNavigableItem } from '@sicilyaction/lib-ng-bootstrap';

export const SidebarActionsInternal = createActionGroup({
  source: 'Sidebar/Internal',
  events: {}
});


export const SidebarActions = createActionGroup({
  source: 'Sidebar/API',
  events: {
    SetItems: props<{ items: SidebarNavigableItem[] }>(),
    SetVisible: props<{ visible: boolean }>(),
    SetLoginVisible: props<{ visible: boolean }>(),
    SetAppsVisible: props<{ visible: boolean }>(),
    SetSearchVisible: props<{ visible: boolean }>(),
    SetSettingsVisible: props<{ visible: boolean }>(),
    SetSearchText: props<{ text: string | null }>(),
  }
});

