import { NavigableItem } from "@rlb/ng-bootstrap";

export const sidebarsFeatureKey = 'sidebar';

export interface Sidebar {
  items: NavigableItem[]
  visible: boolean
  loginVisible: boolean
  searchVisible: boolean
  settingsVisible: boolean
}

export const initialSidebarState: Sidebar = {
  items: [],
  visible: true,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true
}

export interface SidebarState { [sidebarsFeatureKey]: Sidebar }