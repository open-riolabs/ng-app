import { createActionGroup, props } from '@ngrx/store';
import { NavbarHeader } from './navbar.model';

export const NavbarActionsInternal = createActionGroup({
  source: 'Navbar/Internal',
  events: {},
});

export const NavbarActions = createActionGroup({
  source: 'Navbar/API',
  events: {
    SetVisible: props<{ visible: boolean }>(),
    SetSearchVisible: props<{ visible: boolean }>(),
    SetHeader: props<{ header: NavbarHeader | null }>(),
    SetSearchText: props<{ text: string | null }>(),
    SetLeftItems: props<{ items: string[] }>(),
    SetRightItems: props<{ items: string[] }>(),
    SetLoginVisible: props<{ visible: boolean }>(),
    SetSettingsVisible: props<{ visible: boolean }>(),
    SetAppsVisible: props<{ visible: boolean }>(),
    SetSeparatorVisible: props<{ visible: boolean }>(),
  },
});
