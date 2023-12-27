import { createFeature, createReducer, on } from '@ngrx/store';
import { appContextFeatureKey, initialAppContextState } from './app-context.model';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';

export const appContextFeature = createFeature({
  name: appContextFeatureKey,
  reducer: createReducer(
    initialAppContextState,
    on(AppContextActions.setAppName, (state, { appName }) => ({ ...state, appName })),
    on(AppContextActions.setAppContext, (state, { appContext }) => ({ ...state, appContext })),
    on(AppContextActionsInternal.setLanguage, (state, { language }) => ({ ...state, language })),
    on(AppContextActionsInternal.setSupportedLanguages, (state, { supportedLanguages }) => ({ ...state, supportedLanguages })),
  )
});

export const sidebarReducer = appContextFeature.reducer;

export const {
  selectSidebarState
} = appContextFeature;