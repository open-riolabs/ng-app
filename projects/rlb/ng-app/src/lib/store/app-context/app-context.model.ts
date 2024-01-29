import { AppItem } from "../../services/apps/app";

export const appContextFeatureKey = 'app';

export interface AppContext {
  apps: AppItem[]
  currentApp: AppItem | null | undefined,
  language: string | null,
  supportedLanguages: string[]
}

export const initialAppContextState: AppContext = {
  apps: [],
  currentApp: null,
  language: null,
  supportedLanguages: ['en']
}

export interface AppState { [appContextFeatureKey]: AppContext }
