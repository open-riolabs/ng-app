import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NavigableItem } from '@rlb/ng-bootstrap';

export const AppContextActionsInternal = createActionGroup({
  source: 'AppContext/Internal',
  events: {
    setLanguage: props<{ language: string }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[] }>(),
  }
});


export const AppContextActions = createActionGroup({
  source: 'AppContext/API',
  events: {
    setLanguage: props<{ language: string }>(),
    setSupportedLanguages: props<{ supportedLanguages: string[] }>(),
    setAppName: props<{ appName: string }>(),
    setAppContext: props<{ appContext: NavigableItem[] }>(),
  }
});
