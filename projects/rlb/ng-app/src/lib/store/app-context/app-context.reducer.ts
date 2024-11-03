import { createFeature, createReducer, on } from '@ngrx/store';
import { appContextFeatureKey, initialAppContextState } from './app-context.model';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';

export const appFeature = createFeature({
  name: appContextFeatureKey,
  reducer: createReducer(
    initialAppContextState,
    on(AppContextActions.setCurrentApp, (state, { app }) => ({ ...state, currentApp: app })),
    on(AppContextActions.removeApp, (state, { appId }) => ({ ...state, apps: state.apps.filter(a => a.id !== appId) })),
    on(AppContextActionsInternal.addApp, (state, { app }) => {
      if(!app) return state;
      const apps = state.apps.filter(a => a.id !== app.id);
      apps.push(app);
      return { ...state, apps };
    }),
    on(AppContextActionsInternal.setLanguage, (state, { language }) => ({ ...state, language })),
    on(AppContextActionsInternal.setSupportedLanguages, (state, { supportedLanguages }) => ({ ...state, supportedLanguages })),
    on(AppContextActionsInternal.setTheme, (state, { theme }) => ({ ...state, theme }))
  )
});

export const appReducer = appFeature.reducer;

export const {
  selectAppState,
  selectApps,
  selectCurrentApp,
  selectSupportedLanguages
} = appFeature;
