import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Auth } from './auth.model';

export const AuthActionsInternal = createActionGroup({
  source: 'Auth/Internal',
  events: {
    'SetUser': props<{ user: any }>(),
    'SetAuth': props<{ auth: Auth }>(),
    'SetLoading': props<{ loading: boolean }>(),
    'Reset': emptyProps(),
  }
});


export const AuthActions = createActionGroup({
  source: 'Auth/API',
  events: {
    'Login': emptyProps(),
    'Logout': emptyProps(),
  }
});
