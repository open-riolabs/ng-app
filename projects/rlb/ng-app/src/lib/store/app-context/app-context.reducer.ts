import { createFeature, createReducer, on } from '@ngrx/store';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';
import { appContextFeatureKey, initialAppContextState } from './app-context.model';

export const appFeature = createFeature({
  name: appContextFeatureKey,
  reducer: createReducer(
    initialAppContextState,
    on(AppContextActionsInternal.setCurrentApp, (state, { app, mode, url }) => ({ ...state, currentApp: app ? { ...app, viewMode: mode, navigationUrl: url } : null })),
    on(AppContextActions.removeApp, (state, { appType }) => ({ ...state, apps: state.apps.filter(a => a.type !== appType) })),
    on(AppContextActions.finalizeApp, (state, { appType, data, appId, actions }) => {
      const appsOfType = state.apps.filter(a => a.type === appType);
      if (appsOfType.length === 0) throw new Error(`App type: ${appType} not found. Cannot finalize app.`);
      let updatedAppsOfType: typeof appsOfType;
      if (appsOfType.length === 1 && !appsOfType[0].id) {
        updatedAppsOfType = [{ ...appsOfType[0], data, id: appId, actions }];
      } else {
        updatedAppsOfType = [...appsOfType, { ...appsOfType[0], data, id: appId, actions}];
      }
      const remainingApps = state.apps.filter(a => a.type !== appType);
      return { ...state, apps: [...remainingApps, ...updatedAppsOfType], };
    }),
    on(AppContextActionsInternal.addApp, (state, { app }) => {
      if (!app) return state;
      const apps = state.apps.filter(a => a.type !== app.type);
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
