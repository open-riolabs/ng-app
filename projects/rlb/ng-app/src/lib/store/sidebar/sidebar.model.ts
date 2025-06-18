import { SidebarNavigableItem } from "@rlb-core/lib-ng-bootstrap";

export const sidebarsFeatureKey = 'sidebar';

export interface Sidebar {
  items: SidebarNavigableItem[];
  visible: boolean;
  loginVisible: boolean;
  searchVisible: boolean;
  appsVisible: boolean;
  settingsVisible: boolean;
  searchText: string | null;
}

export const initialSidebarState: Sidebar = {
  items: [],
  visible: true,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true,
  appsVisible: true,
  searchText: null
};

export interface SidebarState { [sidebarsFeatureKey]: Sidebar; }
