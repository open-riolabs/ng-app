import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AppItem } from '../../services/apps/app';

export const AppContextActionsInternal = createActionGroup({
  source: 'AppContext/Internal',
  events: {
    setLanguage: props<{ language: string }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[] }>(),
    setTheme: props<{ theme: 'light' | 'dark' }>(),
  }
});


export const AppContextActions = createActionGroup({
  source: 'AppContext/API',
  events: {
    setLanguage: props<{ language: string }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[] }>(),
    setCurrentApp: props<{ app: AppItem | null | undefined }>(),
    addApp: props<{ app: AppItem }>(),
    removeApp: props<{ appId: string }>(),
    setTheme: props<{ theme: 'light' | 'dark' }>(),
  }
});
