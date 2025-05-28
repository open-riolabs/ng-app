import { InjectionToken } from "@angular/core";
import { AppInfo } from "../../services/apps/app";
import { AppDescriber } from "../../services/apps/app-describer";

export const appContextFeatureKey = 'app';
export type AppTheme = 'light' | 'dark';
export type PageTemplate = 'app' | 'basic' | 'cms' | 'content';
export const RLB_APPS = new InjectionToken<AppDescriber>(`rlb.apps`);

export interface AppContext {
  apps: AppInfo[];
  currentApp: AppInfo | null,
  language: string | null,
  theme: AppTheme,
  supportedLanguages: string[];
}

export const initialAppContextState: AppContext = {
  apps: [],
  currentApp: null,
  language: null,
  supportedLanguages: ['en'],
  theme: 'light'
};

export interface AppState { [appContextFeatureKey]: AppContext; }
