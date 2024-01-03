import { NavigableItem } from "@rlb/ng-bootstrap";

export const navbarsFeatureKey = 'navbar';

export interface Navbar {
  visible: boolean
  header: string | null,
  loginVisible: boolean
  searchVisible: boolean
  settingsVisible: boolean
  searchText: string | null,
  leftItems: string[],
  rightItems: string[],
}

export const initialNavbarState: Navbar = {
  visible: true,
  header: null,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true,
  searchText: null,
  leftItems: [],
  rightItems: [],
}

export interface NavbarState { [navbarsFeatureKey]: Navbar }