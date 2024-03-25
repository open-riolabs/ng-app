import { AppItem } from "../../services/apps/app";

export const appContextFeatureKey = 'app';

export interface AppContext {
  apps: AppItem[]
  currentApp: AppItem | null | undefined,
  language: string | null,
  theme: 'light' | 'dark',
  supportedLanguages: string[]
}

export const initialAppContextState: AppContext = {
  apps: [],
  currentApp: null,
  language: null,
  supportedLanguages: ['en'],
  theme: 'light'
}

export interface AppState { [appContextFeatureKey]: AppContext }
