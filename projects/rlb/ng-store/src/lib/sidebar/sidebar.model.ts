import { NavigableItem } from "@rlb/ng-bootstrap";

export const sidebarsFeatureKey = 'sidebar';

export interface Sidebar {
  items: NavigableItem[]
  hasLogin: boolean
  hasSearch: boolean
  visible: boolean
}

export const initialSidebarState: Sidebar = {
  items: [],
  hasLogin: false,
  hasSearch: false,
  visible: false
}

export interface SidebarState { [sidebarsFeatureKey]: Sidebar }