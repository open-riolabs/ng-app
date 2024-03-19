import { createFeature, createReducer, on } from '@ngrx/store';
import { navbarsFeatureKey, initialNavbarState } from './navbar.model';
import { NavbarActions } from './navbar.actions';

export const navbarsFeature = createFeature({
  name: navbarsFeatureKey,
  reducer: createReducer(
    initialNavbarState,
    on(NavbarActions.setVisible, (state, { visible }) => ({ ...state, visible })),
    on(NavbarActions.setSearchVisible, (state, { visible }) => ({ ...state, searchVisible: visible })),
    on(NavbarActions.setHeader, (state, { header }) => ({ ...state, header })),
    on(NavbarActions.setSearchText, (state, { text }) => ({ ...state, searchText: text })),
    on(NavbarActions.setLeftItems, (state, { items }) => ({ ...state, leftItems: items })),
    on(NavbarActions.setRightItems, (state, { items }) => ({ ...state, rightItems: items })),
  )
});

export const navbarReducer = navbarsFeature.reducer;

export const {
  selectNavbarState
} = navbarsFeature;
