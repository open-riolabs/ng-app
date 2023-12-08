import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Sidebar } from './sidebar.model';

export const SidebarActionsInternal = createActionGroup({
  source: 'Sidebar/Internal',
  events: {

  }
});


export const SidebarActions = createActionGroup({
  source: 'Sidebar/API',
  events: {

  }
});
