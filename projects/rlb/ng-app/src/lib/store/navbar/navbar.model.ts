import { NavigableItem } from "@rlb/ng-bootstrap";

export const navbarsFeatureKey = 'navbar';

export interface Navbar {
  items: NavigableItem[],
  visible: boolean
  header: string | null,
  loginVisible: boolean
  searchVisible: boolean
  settingsVisible: boolean
}

export const initialNavbarState: Navbar = {
  visible: true,
  header: null,
  loginVisible: true,
  searchVisible: true,
  settingsVisible: true,
  items: []
}

export interface NavbarState { [navbarsFeatureKey]: Navbar }