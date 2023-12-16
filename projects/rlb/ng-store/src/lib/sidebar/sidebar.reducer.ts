import { createFeature, createReducer, on } from '@ngrx/store';
import { sidebarsFeatureKey, initialSidebarState } from './sidebar.model';
import { SidebarActions, SidebarActionsInternal } from './sidebar.actions';

export const sidebarsFeature = createFeature({
  name: sidebarsFeatureKey,
  reducer: createReducer(
    initialSidebarState,
    on(SidebarActionsInternal.setHasLogin, (state, action) => ({ ...state, hasLogin: action.visible })),
    on(SidebarActionsInternal.setHasSearch, (state, action) => ({ ...state, hasSearch: action.visible })),
    on(SidebarActionsInternal.setVisible, (state, action) => ({ ...state, visible: action.visible })),
    on(SidebarActionsInternal.update, (state, action) => ({ ...state, items: action.items })),
  )
});

export const sidebarReducer = sidebarsFeature.reducer;

export const {
  selectSidebarState
} = sidebarsFeature;