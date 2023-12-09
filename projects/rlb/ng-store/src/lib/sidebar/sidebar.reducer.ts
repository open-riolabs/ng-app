import { createFeature, createReducer, on } from '@ngrx/store';
import { sidebarsFeatureKey, initialSidebarState } from './sidebar.model';
import { SidebarActions } from './sidebar.actions';

export const sidebarsFeature = createFeature({
  name: sidebarsFeatureKey,
  reducer: createReducer(
    initialSidebarState,
    on(SidebarActions.setHasLogin, (state, action) => ({ ...state, hasLogin: action.visible })),
    on(SidebarActions.setHasSearch, (state, action) => ({ ...state, hasSearch: action.visible })),
    on(SidebarActions.setVisible, (state, action) => ({ ...state, visible: action.visible })),
    on(SidebarActions.update, (state, action) => ({ ...state, items: action.items })),
  )
});

export const sidebarReducer = sidebarsFeature.reducer;

export const {
  selectSidebarState
} = sidebarsFeature;