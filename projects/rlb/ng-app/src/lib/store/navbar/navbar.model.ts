import { NavigableItem } from "@rlb/ng-bootstrap";

export const navbarsFeatureKey = 'navbar';

export interface Navbar {
  visible: boolean
  header: string | null,
  searchVisible: boolean
  searchText: string | null,
  leftItems: string[],
  rightItems: string[],
}

export const initialNavbarState: Navbar = {
  visible: true,
  header: null,
  searchVisible: true,
  searchText: null,
  leftItems: [],
  rightItems: [],
}

export interface NavbarState { [navbarsFeatureKey]: Navbar }
