import { createFeature, createReducer, on } from '@ngrx/store';
import { sidebarsFeatureKey, initialSidebarState } from './sidebar.model';
import { SidebarActions } from './sidebar.actions';

export const sidebarsFeature = createFeature({
  name: sidebarsFeatureKey,
  reducer: createReducer(
    initialSidebarState,
    on(SidebarActions.setItems, (state, { items }) => ({ ...state, items })),
    on(SidebarActions.setVisible, (state, { visible }) => ({ ...state, visible })),
    on(SidebarActions.setLoginVisible, (state, { visible }) => ({ ...state, loginVisible: visible })),
    on(SidebarActions.setSearchVisible, (state, { visible }) => ({ ...state, searchVisible: visible })),
    on(SidebarActions.setSettingsVisible, (state, { visible }) => ({ ...state, settingsVisible: visible }))
  )
});

export const sidebarReducer = sidebarsFeature.reducer;

export const {
  selectSidebarState
} = sidebarsFeature;