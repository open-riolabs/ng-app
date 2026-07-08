import { NavigableItem, SidebarNavigableItem } from "@open-rlb/ng-bootstrap";

export const sidebarsFeatureKey = 'sidebar';

export interface Sidebar {
  items: SidebarNavigableItem[];
  visible: boolean;
  loginVisible: boolean;
  searchVisible: boolean;
  appsVisible: boolean;
  settingsVisible: boolean;
  searchText: string | null;
  footerComponent: string | null;
}

export const initialSidebarState: Sidebar = {
  items: [],
  visible: true,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true,
  appsVisible: true,
  searchText: null,
  footerComponent: null
};

export interface SidebarState { [sidebarsFeatureKey]: Sidebar; }
