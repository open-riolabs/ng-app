import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AppItem } from '../../services/apps/app';
import { AppTheme } from './app-context.model';

export const AppContextActionsInternal = createActionGroup({
  source: 'AppContext/Internal',
  events: {
    setLanguage: props<{ language: string }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[] }>(),
    setTheme: props<{ theme: AppTheme }>(),
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
    setTheme: props<{ theme: AppTheme }>(),
  }
});
