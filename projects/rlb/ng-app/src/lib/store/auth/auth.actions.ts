import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActionsInternal = createActionGroup({
  source: 'Auth/Internal',
  events: {
    'SetCurrentProvider': props<{ currentProvider: string; }>(),
    'SetLoading': props<{ loading: boolean; }>(),
    'Reset': emptyProps(),
  }
});


export const AuthActions = createActionGroup({
  source: 'Auth/API',
  events: {
    'Login': emptyProps(),
    'Logout': emptyProps(),
    'SetCurrentProvider': props<{ currentProvider: string; }>(),
  }
});
