export const navbarsFeatureKey = 'navbar';

export type NavbarHeader =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string; alt?: string; height?: number };

export type NavbarActionsLayout = 'default' | 'dropdown';

export interface Navbar {
  visible: boolean;
  header: NavbarHeader | null;
  searchVisible: boolean;
  searchText: string | null;
  leftItems: string[];
  rightItems: string[];
  loginVisible: boolean;
  settingsVisible: boolean;
  appsVisible: boolean;
  separatorVisible: boolean;
  actionsLayout: NavbarActionsLayout;
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
  separatorVisible: true,
  actionsLayout: 'dropdown',
};

export interface NavbarState {
  [navbarsFeatureKey]: Navbar;
}
