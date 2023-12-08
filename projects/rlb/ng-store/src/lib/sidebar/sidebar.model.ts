export const sidebarsFeatureKey = 'sidebar';

export interface Sidebar<T = any> {

}

export const initialSidebarState: Sidebar = {
  
}

export interface SidebarState { [sidebarsFeatureKey]: Sidebar }