import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Navbar } from './navbar.model';

export const NavbarActionsInternal = createActionGroup({
  source: 'Navbar/Internal',
  events: {

  }
});


export const NavbarActions = createActionGroup({
  source: 'Navbar/API',
  events: {

  }
});
