import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Auth } from './auth.model';

export const AuthActionsInternal = createActionGroup({
  source: 'Auth/Internal',
  events: {
    'SetUser': props<{ user: any }>(),
    'SetAuth': props<{ auth: Auth }>(),
    'SetIdToken': props<{ idToken: string | null | undefined }>(),
    'SetAccessToken': props<{ accessToken: string | null | undefined }>(),
    'SetIsAuth': props<{ isAuth: boolean }>(),
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
