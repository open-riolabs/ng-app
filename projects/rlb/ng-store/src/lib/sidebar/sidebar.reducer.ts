import { createFeature, createReducer, on } from '@ngrx/store';
import { sidebarsFeatureKey, initialSidebarState } from './sidebar.model';
import { SidebarActionsInternal } from './sidebar.actions';

export const sidebarsFeature = createFeature({
  name: sidebarsFeatureKey,
  reducer: createReducer(
    initialSidebarState,
    //on(SidebarActionsInternal.setLoading, (state, action) => ({ ...state, loading: action.loading })),


  )
});

export const sidebarReducer = sidebarsFeature.reducer;

export const {
  selectSidebarState
} = sidebarsFeature;