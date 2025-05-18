import { createFeature, createReducer, on } from '@ngrx/store';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';
import { appContextFeatureKey, initialAppContextState } from './app-context.model';

export const appFeature = createFeature({
  name: appContextFeatureKey,
  reducer: createReducer(
    initialAppContextState,
    on(AppContextActions.setCurrentApp, (state, { app, mode }) => ({ ...state, currentApp: app ? { ...app, viewMode: mode } : null })),
    on(AppContextActions.removeApp, (state, { appId }) => ({ ...state, apps: state.apps.filter(a => a.id !== appId) })),
    on(AppContextActionsInternal.addApp, (state, { app }) => {
      if (!app) return state;
      const apps = state.apps.filter(a => a.id !== app.id);
      apps.push(app);
      return { ...state, apps };
    }),
    on(AppContextActionsInternal.setLanguage, (state, { language }) => ({ ...state, language })),
    on(AppContextActionsInternal.setSupportedLanguages, (state, { supportedLanguages }) => ({ ...state, supportedLanguages })),
    on(AppContextActionsInternal.setTheme, (state, { theme }) => ({ ...state, theme })),
    on(AppContextActionsInternal.setViewMode, (state, { viewMode }) => ({ ...state, viewMode })))
});

export const appReducer = appFeature.reducer;

export const {
  selectAppState,
  selectApps,
  selectCurrentApp,
  selectSupportedLanguages
} = appFeature;
