import { createFeature, createReducer, on } from '@ngrx/store';
import { navbarsFeatureKey, initialNavbarState } from './navbar.model';
import { NavbarActions } from './navbar.actions';

export const navbarsFeature = createFeature({
  name: navbarsFeatureKey,
  reducer: createReducer(
    initialNavbarState,
    on(NavbarActions.setItems, (state, { items }) => ({ ...state, items })),
    on(NavbarActions.setVisible, (state, { visible }) => ({ ...state, visible })),
    on(NavbarActions.setLoginVisible, (state, { visible }) => ({ ...state, loginVisible: visible })),
    on(NavbarActions.setSearchVisible, (state, { visible }) => ({ ...state, searchVisible: visible })),
    on(NavbarActions.setSettingsVisible, (state, { visible }) => ({ ...state, settingsVisible: visible })),
    on(NavbarActions.setHeader, (state, { header }) => ({ ...state, header }))
  )
});

export const navbarReducer = navbarsFeature.reducer;

export const {
  selectNavbarState
} = navbarsFeature;    