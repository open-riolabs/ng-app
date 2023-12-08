import { createFeature, createReducer, on } from '@ngrx/store';
import { navbarsFeatureKey, initialNavbarState } from './navbar.model';
import { NavbarActionsInternal } from './navbar.actions';

export const navbarsFeature = createFeature({
  name: navbarsFeatureKey,
  reducer: createReducer(
    initialNavbarState,
    //on(NavbarActionsInternal.setLoading, (state, action) => ({ ...state, loading: action.loading })),


  )
});

export const navbarReducer = navbarsFeature.reducer;

export const {
  selectNavbarState
} = navbarsFeature;