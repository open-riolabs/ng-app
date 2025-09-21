import { NavigableItem } from "@rlb-core/lib-ng-bootstrap";

export const navbarsFeatureKey = 'navbar';

export interface Navbar {
  visible: boolean
  header: string | null,
  searchVisible: boolean
  searchText: string | null,
  leftItems: string[],
  rightItems: string[],
  loginVisible: boolean,
  settingsVisible: boolean,
  appsVisible: boolean,
}

export const initialNavbarState: Navbar = {
  visible: true,
  header: null,
  searchVisible: true,
  searchText: null,
  leftItems: [],
  rightItems: [],
  loginVisible: false,
  settingsVisible: false,
  appsVisible: false,
}

export interface NavbarState { [navbarsFeatureKey]: Navbar }

