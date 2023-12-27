import { NavigableItem } from "@rlb/ng-bootstrap";

export const appContextFeatureKey = 'sidebar';

export interface AppContext {
  items: NavigableItem[]
  visible: boolean
  loginVisible: boolean
  searchVisible: boolean
  settingsVisible: boolean
}

export const initialAppContextState: AppContext = {
  items: [],
  visible: true,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true
}

export interface appContexttate { [appContextFeatureKey]: AppContext }