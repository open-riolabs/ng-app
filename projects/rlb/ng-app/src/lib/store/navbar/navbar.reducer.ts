import { createFeature, createReducer, on } from '@ngrx/store';
import { navbarsFeatureKey, initialNavbarState } from './navbar.model';
import { NavbarActions, NavbarActionsInternal } from './navbar.actions';

export const navbarsFeature = createFeature({
  name: navbarsFeatureKey,
  reducer: createReducer(
    initialNavbarState,
    on(NavbarActionsInternal.setHasLogin, (state, action) => ({ ...state, hasLogin: action.visible })),
    on(NavbarActionsInternal.setHasSearch, (state, action) => ({ ...state, hasSearch: action.visible })),
    on(NavbarActionsInternal.setVisible, (state, action) => ({ ...state, visible: action.visible })),
    on(NavbarActionsInternal.update, (state, action) => ({ ...state, items: action.items })),
  )
});

export const navbarReducer = navbarsFeature.reducer;

export const {
  selectNavbarState
} = navbarsFeature;