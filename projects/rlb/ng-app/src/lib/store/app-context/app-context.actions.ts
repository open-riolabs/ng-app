import { createActionGroup, props } from '@ngrx/store';
import { AppInfo, AppViewMode } from '../../services/apps/app';
import { AppTheme } from './app-context.model';

export const AppContextActionsInternal = createActionGroup({
  source: 'AppContext/Internal',
  events: {
    setLanguage: props<{ language: string; }>(),
    setCurrentApp: props<{ app?: AppInfo; }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[]; }>(),
    setTheme: props<{ theme: AppTheme; }>(),
    addApp: props<{ app: AppInfo; }>(),
    setViewMode: props<{ viewMode?: AppViewMode; }>(),
  }
});


export const AppContextActions = createActionGroup({
  source: 'AppContext/API',
  events: {
    setLanguage: props<{ language: string; }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[]; }>(),
    setCurrentApp: props<{ app?: AppInfo, mode?: AppViewMode; }>(),
    removeApp: props<{ appId: string; }>(),
    setTheme: props<{ theme: AppTheme; }>(),
  }
});
