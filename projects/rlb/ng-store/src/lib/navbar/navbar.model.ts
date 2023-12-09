import { NavigableItem } from "@rlb/ng-bootstrap";

export const navbarsFeatureKey = 'navbar';

export interface Navbar {
  items: NavigableItem[]
  hasLogin: boolean
  hasSearch: boolean
  visible: boolean
}

export const initialNavbarState: Navbar = {
  visible: true,
  hasLogin: true,
  hasSearch: true,
  items: []
}

export interface NavbarState { [navbarsFeatureKey]: Navbar }